import { NextResponse } from 'next/server';
import connectDB from '@/lib/db';
import User from '@/models/User';
import Course from '@/models/Course';
import Payment from '@/models/Payment';
import Enrollment from '@/models/Enrollment';
import { getUserFromCookie } from '@/utils/auth';

export async function GET(req) {
  try {
    const adminUser = getUserFromCookie();
    if (!adminUser || adminUser.role !== 'admin') {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    await connectDB();

    // 1. Basic Stats
    const totalUsers = await User.countDocuments();
    const totalCourses = await Course.countDocuments();
    const activeStudents = await Enrollment.distinct('userId').then(users => users.length);
    
    const payments = await Payment.find({ status: 'completed' });
    const totalRevenue = payments.reduce((sum, p) => sum + p.amount, 0);

    // 2. Recent Activity
    const recentUsers = await User.find()
      .sort({ createdAt: -1 })
      .limit(5)
      .select('name email role createdAt');

    const recentPayments = await Payment.find({ status: 'completed' })
      .sort({ createdAt: -1 })
      .limit(5)
      .populate('userId', 'name email')
      .populate('courseId', 'title');

    // 3. Chart Data (Last 6 months)
    const sixMonthsAgo = new Date();
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 5);
    sixMonthsAgo.setDate(1);
    sixMonthsAgo.setHours(0, 0, 0, 0);

    const userGrowth = await User.aggregate([
      { $match: { createdAt: { $gte: sixMonthsAgo } } },
      {
        $group: {
          _id: { month: { $month: "$createdAt" }, year: { $year: "$createdAt" } },
          count: { $sum: 1 }
        }
      },
      { $sort: { "_id.year": 1, "_id.month": 1 } }
    ]);

    const salesGrowth = await Payment.aggregate([
      { $match: { createdAt: { $gte: sixMonthsAgo }, status: 'completed' } },
      {
        $group: {
          _id: { month: { $month: "$createdAt" }, year: { $year: "$createdAt" } },
          revenue: { $sum: "$amount" }
        }
      },
      { $sort: { "_id.year": 1, "_id.month": 1 } }
    ]);

    // Format chart data for Recharts
    const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
    
    const formattedUserGrowth = userGrowth.map(item => ({
      name: `${months[item._id.month - 1]} ${item._id.year}`,
      users: item.count
    }));

    const formattedSalesGrowth = salesGrowth.map(item => ({
      name: `${months[item._id.month - 1]} ${item._id.year}`,
      revenue: item.revenue
    }));

    return NextResponse.json({
      success: true,
      data: {
        stats: {
          totalUsers,
          totalCourses,
          totalRevenue,
          activeStudents
        },
        recentActivity: {
          users: recentUsers,
          payments: recentPayments
        },
        charts: {
          userGrowth: formattedUserGrowth,
          salesGrowth: formattedSalesGrowth
        }
      }
    });
  } catch (error) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
