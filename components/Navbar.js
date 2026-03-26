'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useSelector, useDispatch } from 'react-redux';
import { logout } from '@/redux/slices/authSlice';
import { Dropdown } from 'react-bootstrap';
import { FaUserCircle } from 'react-icons/fa';

import TrialModal from './home/TrialModal';

const CoursesMega = ({ menu, submenus, getSubmenus }) => {
  const [activeCat, setActiveCat] = useState(submenus[0]?._id || null);

  return (
    <li className="nav-item dropdown dropdown-mega">
      <a className="nav-link dropdown-toggle fw-bold" href="#" data-bs-toggle="dropdown">
        {menu.title}
      </a>
      <div className="dropdown-menu courses-mega p-0 shadow-lg border-0" onClick={e => e.stopPropagation()}>
        {/* Desktop Mega */}
        <div className="d-none d-lg-block">
          <div className="row g-0">
            <div className="col-lg-3 courses-left">
              {submenus.map(cat => (
                <button
                  key={cat._id}
                  className={`cat-btn ${activeCat === cat._id ? 'active' : ''}`}
                  onMouseEnter={() => setActiveCat(cat._id)}
                  type="button"
                >
                  <span>{cat.title}</span>
                  <span className="chev">›</span>
                </button>
              ))}
            </div>
            <div className="col-lg-9 courses-right">
              <div className="right-title">
                {submenus.find(c => c._id === activeCat)?.title}
              </div>
              <div className="cat-panel">
                <div className="row g-3">
                  {getSubmenus(activeCat).map(item => (
                    <div className="col-md-6" key={item._id}>
                      <Link className="course-item" href={item.url}>
                        <div className="course-icon">{item.icon || '🎵'}</div>
                        <div>
                          <div className="name">{item.title}</div>
                          <div className="meta">{item.metaText}</div>
                        </div>
                      </Link>
                    </div>
                  ))}
                </div>
                <Link className="see-all" href={submenus.find(c => c._id === activeCat)?.url || '#'}>
                  See all Courses <span>→</span>
                </Link>
              </div>
            </div>
          </div>
        </div>
        {/* Mobile Mega (Accordion) */}
        <div className="d-lg-none mobile-accordion-wrap p-3">
          <div className="accordion" id="coursesAccordion">
            {submenus.map((cat, idx) => (
              <div className="accordion-item border-0" key={cat._id}>
                <h2 className="accordion-header">
                  <button
                    className={`accordion-button ${idx !== 0 ? 'collapsed' : ''}`}
                    type="button"
                    data-bs-toggle="collapse"
                    data-bs-target={`#cat-${cat._id}`}
                  >
                    {cat.title}
                  </button>
                </h2>
                <div
                  id={`cat-${cat._id}`}
                  className={`accordion-collapse collapse ${idx === 0 ? 'show' : ''}`}
                  data-bs-parent="#coursesAccordion"
                >
                  <div className="accordion-body p-2">
                    <div className="row g-2">
                      {getSubmenus(cat._id).map(item => (
                        <div className="col-12" key={item._id}>
                          <Link className="course-item" href={item.url}>
                            <div className="course-icon">{item.icon || '🎵'}</div>
                            <div>
                              <div className="name">{item.title}</div>
                              <div className="meta">{item.metaText}</div>
                            </div>
                          </Link>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </li>
  );
};

const LabsMega = ({ menu, submenus, getSubmenus }) => {
  const [openSchool, setOpenSchool] = useState(null);

  return (
    <li className="nav-item dropdown dropdown-mega">
      <a className="nav-link dropdown-toggle" href="#" data-bs-toggle="dropdown">
        {menu.title}
      </a>
      <div className="dropdown-menu mega-menu p-0 shadow-lg border-0">
        <div className="p-3 p-lg-4">
          <div className="row g-3 g-lg-4">
            <div className="col-lg-4">
              <div className="mega-left p-4 rounded-4 bg-primary bg-opacity-10">
                <h5 className="fw-bold">{menu.title} Programs</h5>
                <p className="small text-muted mb-3">
                  {menu.metaText || 'Music education built for every learner — offline, online, and school partnerships. Affiliated with Trinity College, London.'}
                </p>
                <span className="mega-badge px-3 py-1 bg-white rounded-pill small border">Hybrid Learning • Since 2011</span>
              </div>
            </div>
            <div className="col-lg-8">
              <div className="row g-3">
                {submenus.map(school => (
                  <div className="col-md-6" key={school._id}>
                    <div
                      className="mega-card p-3 border rounded-3 cursor-pointer"
                      onClick={() => setOpenSchool(openSchool === school._id ? null : school._id)}
                    >
                      <div className="d-flex gap-3 align-items-center mb-2">
                        <div className="mega-ic fs-3">{school.icon || '🏫'}</div>
                        <h6 className="fw-bold mb-0">{school.title}</h6>
                      </div>
                      <div className={`programs transition-all overflow-hidden ${openSchool === school._id ? 'max-h-500 mt-3' : 'max-h-0'}`}>
                        {getSubmenus(school._id).map(prog => (
                          <Link key={prog._id} className="dropdown-item p-2 rounded-2 mb-2 bg-light border-start border-primary border-4" href={prog.url}>
                            <h6 className="small fw-bold mb-1">{prog.title}</h6>
                            <p className="very-small text-muted mb-0">{prog.metaText}</p>
                          </Link>
                        ))}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </li>
  );
};

const Navbar = ({ initialMenus = [], theme = {} }) => {
  const dispatch = useDispatch();
  const { user, isAuthenticated } = useSelector((state) => state.auth);
  const [mounted, setMounted] = useState(false);
  const [dynamicMenus, setDynamicMenus] = useState(initialMenus.filter(m => m.isActive && m.type === 'header'));

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (initialMenus.length > 0) return;

    const fetchMenus = async () => {
      try {
        const res = await fetch('/api/admin/menus');
        const data = await res.json();
        if (data.success) {
          const headerMenus = data.data.filter(m => m.isActive && m.type === 'header');
          setDynamicMenus(headerMenus);
        }
      } catch (error) {
        console.error('Failed to fetch menus:', error);
      }
    };
    fetchMenus();
  }, [initialMenus]);

  // Helper to get children for a menu item
  const getSubmenus = (parentId) => {
    return dynamicMenus.filter(m => m.parentId === parentId).sort((a, b) => a.order - b.order);
  };

  // Helper to get dashboard URL based on role
  const getDashboardUrl = (role) => {
    switch (role) {
      case 'admin': return '/admin';
      case 'instructor': return '/instructor';
      case 'school_admin': return '/school/dashboard';
      default: return '/student/dashboard';
    }
  };

  if (!mounted) return null;

  return (
    <>
      <nav className="navbar navbar-expand-lg u-navbar">
        <div className="container">
          <Link className="u-brand" href="/">
            {theme?.siteLogo ? (
              <img src={theme.siteLogo} alt={theme.siteName || 'Logo'} style={{ maxHeight: '40px' }} />
            ) : (
              theme?.siteName || 'UNIKRITI'
            )}
          </Link>
          <button
            className="navbar-toggler"
            type="button"
            data-bs-toggle="collapse"
            data-bs-target="#navMain"
          >
            <span className="navbar-toggler-icon" />
          </button>
          <div className="collapse navbar-collapse" id="navMain">
            <ul className="navbar-nav ms-auto align-items-center">
              {/* DYNAMIC MENUS */}
              {(() => {
                const renderMenuItem = (menu, isSub = false) => {
                  const submenus = getSubmenus(menu._id);

                  if (submenus.length > 0) {
                    // Check for Special Mega Menus
                    if (menu.title.toLowerCase() === 'courses') {
                      return <CoursesMega key={menu._id} menu={menu} submenus={submenus} getSubmenus={getSubmenus} />;
                    }
                    if (menu.title.toLowerCase() === 'music labs') {
                      return <LabsMega key={menu._id} menu={menu} submenus={submenus} getSubmenus={getSubmenus} />;
                    }

                    // Check for Default Mega Menu
                    const isMega = !isSub && submenus.some(sub => getSubmenus(sub._id).length > 0);
                    // ... rest of previous mega menu logic ...
                    if (isMega) {
                      return (
                        <li key={menu._id} className="nav-item dropdown dropdown-mega">
                          <a className="nav-link dropdown-toggle" href="#" data-bs-toggle="dropdown">
                            {menu.title}
                          </a>
                          <div className="dropdown-menu p-4 shadow-lg border-0">
                            <div className="container">
                              <div className="row g-4">
                                {submenus.map(section => {
                                  const items = getSubmenus(section._id);
                                  return (
                                    <div className="col-md-3" key={section._id}>
                                      <h6 className="u-mega-h">{section.title}</h6>
                                      <ul className="list-unstyled u-mega-links mt-3">
                                        {items.map(item => (
                                          <li key={item._id} className="mb-2">
                                            <Link href={item.url} className="u-mega-link">
                                              {item.title}
                                            </Link>
                                          </li>
                                        ))}
                                      </ul>
                                    </div>
                                  );
                                })}
                              </div>
                            </div>
                          </div>
                        </li>
                      );
                    }

                    // Standard Dropdown (Recursive)
                    return (
                      <li key={menu._id} className={`nav-item dropdown ${isSub ? 'dropend' : ''}`}>
                        <a className={`nav-link dropdown-toggle ${isSub ? 'dropdown-item' : ''}`} href="#" data-bs-toggle="dropdown">
                          {menu.title}
                        </a>
                        <ul className="dropdown-menu border-0 shadow-sm">
                          {submenus.map(sub => renderMenuItem(sub, true))}
                        </ul>
                      </li>
                    );
                  }

                  // Simple Link
                  return (
                    <li key={menu._id} className="nav-item">
                      <Link className={isSub ? "dropdown-item py-2" : "nav-link"} href={menu.url}>
                        {menu.title}
                      </Link>
                    </li>
                  );
                };

                return dynamicMenus
                  .filter(m => m.parentId === null)
                  .sort((a, b) => a.order - b.order)
                  .map(menu => renderMenuItem(menu));
              })()}

              {isAuthenticated ? (
                <li className="nav-item dropdown ms-lg-3 mt-3 mt-lg-0">
                  <Dropdown>
                    <Dropdown.Toggle variant="dark" className="rounded-pill px-4 fw-bold d-flex align-items-center gap-2">
                      <FaUserCircle size={18} /> {user?.name || 'My Account'}
                    </Dropdown.Toggle>
                    <Dropdown.Menu align="end" className="shadow border-0 mt-2">
                      <Dropdown.Item as={Link} href={getDashboardUrl(user?.role)} className="fw-bold py-2">
                        🚀 Go to Dashboard
                      </Dropdown.Item>
                      <Dropdown.Divider />
                      <Dropdown.Item onClick={() => dispatch(logout())} className="text-danger py-2">
                        Log Out
                      </Dropdown.Item>
                    </Dropdown.Menu>
                  </Dropdown>
                </li>
              ) : (
                <li className="nav-item ms-lg-3 mt-3 mt-lg-0">
                  <Link href="/login" className="btn btn-outline-dark text-white rounded-pill px-4 fw-bold">
                    Login / Signup
                  </Link>
                </li>
              )}

              <li className="nav-item ms-lg-2 mt-2 mt-lg-0">
                <button
                  className="btn btn-light rounded-pill px-4 shadow-sm fw-bold"
                  data-bs-toggle="modal"
                  data-bs-target="#trialModal"
                >
                  Book Free Trial
                </button>
              </li>
            </ul>
          </div>
        </div>
      </nav>

      <TrialModal />
    </>
  );
};

export default Navbar;
