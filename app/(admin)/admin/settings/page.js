'use client';

import { useState, useEffect } from 'react';
import { Container, Tabs, Tab, Form, Button, Table, Spinner, Alert, Modal } from 'react-bootstrap';
import { useGetAdminSettingsQuery, useUpdateAdminSettingsMutation } from '@/redux/api/apiSlice';
import { FaTrash, FaPlus, FaSave, FaCheckCircle, FaHome, FaInfoCircle, FaCalendarAlt, FaAward, FaUsers, FaQuoteLeft, FaQuestionCircle, FaEnvelope, FaMapMarkerAlt, FaLink, FaFacebook, FaInstagram, FaLinkedin, FaPalette, FaGlobe, FaCreditCard } from 'react-icons/fa';

export default function AdminSettingsPage() {
  const { data, isLoading, isError } = useGetAdminSettingsQuery();
  const [updateSettings, { isLoading: isUpdating }] = useUpdateAdminSettingsMutation();

  const [categories, setCategories] = useState([]);
  const [banners, setBanners] = useState([]);
  const [hero, setHero] = useState({ title: '', subtitle: '', description: '', videoUrl: '', ctaText: '', ctaUrl: '' });
  const [about, setAbout] = useState({ title: '', text: '', imageUrl: '', ctaText: '', ctaUrl: '', blurbs: [] });
  const [timeline, setTimeline] = useState([]);
  const [awards, setAwards] = useState([]);
  const [team, setTeam] = useState([]);
  const [testimonials, setTestimonials] = useState([]);
  const [faqs, setFaqs] = useState([]);
  const [contact, setContact] = useState({ 
    email: '', 
    phone: '', 
    address: '', 
    mapEmbed: '',
    facebook: '',
    instagram: '',
    linkedin: ''
  });
  const [theme, setTheme] = useState({
    siteName: '',
    siteLogo: '',
    faviconUrl: '',
    metaTitle: '',
    metaDescription: '',
    metaKeywords: '',
    customHeadScripts: '',
    customFooterScripts: ''
  });
  const [emailSmtp, setEmailSmtp] = useState({
    enabled: false,
    host: '',
    port: 587,
    secure: false,
    username: '',
    password: '',
    fromName: '',
    fromEmail: '',
    replyTo: '',
    adminEmails: '',
    subjectPrefix: '',
    customCss: '',
  });
  const [paymentModeOnline, setPaymentModeOnline] = useState(true);
  const [paymentModeLater, setPaymentModeLater] = useState(false);
  const [paymentGateway, setPaymentGateway] = useState('stripe');
  const [showTestOtp, setShowTestOtp] = useState(false);
  const [loginSignupEnabled, setLoginSignupEnabled] = useState(true);

  const [successMsg, setSuccessMsg] = useState('');

  useEffect(() => {
    if (data?.data) {
      const getVal = (key, fallback) => {
        const setting = data.data.find(s => s.key === key);
        return setting ? setting.value : fallback;
      };

      setCategories(getVal('categories', []));
      setBanners(getVal('homepage_banners', []));
      setHero(getVal('hp_hero', { title: '', subtitle: '', description: '', videoUrl: '', ctaText: '', ctaUrl: '' }));
      setAbout(getVal('hp_about', { title: '', text: '', imageUrl: '', ctaText: '', ctaUrl: '', blurbs: [] }));
      setTimeline(getVal('hp_timeline', []));
      setAwards(getVal('hp_awards', []));
      setTeam(getVal('hp_team', []));
      setTestimonials(getVal('hp_testimonials', []));
      setFaqs(getVal('hp_faqs', []));
      setContact(getVal('hp_contact', { 
        email: '', 
        phone: '', 
        address: '', 
        mapEmbed: '',
        facebook: '',
        instagram: getVal('hp_contact', {}).instagram || '',
        linkedin: getVal('hp_contact', {}).linkedin || '' 
      }));
      setTheme(getVal('hp_theme', {
        siteName: '',
        siteLogo: '',
        faviconUrl: '',
        metaTitle: '',
        metaDescription: '',
        metaKeywords: '',
        customHeadScripts: '',
        customFooterScripts: ''
      }));
      setEmailSmtp(getVal('email_smtp', {
        enabled: false,
        host: '',
        port: 587,
        secure: false,
        username: '',
        password: '',
        fromName: '',
        fromEmail: '',
        replyTo: '',
        adminEmails: '',
        subjectPrefix: '',
        customCss: '',
      }));
      setPaymentModeOnline(getVal('payment_mode_online', true));
      setPaymentModeLater(getVal('payment_mode_later', false));
      setPaymentGateway(getVal('payment_gateway', 'stripe'));
      setShowTestOtp(getVal('show_test_otp', false));
      setLoginSignupEnabled(getVal('login_signup_enabled', true));
    }
  }, [data]);

  const handleSave = async (key, value) => {
    try {
      await updateSettings({ settings: [{ key, value }] }).unwrap();
      setSuccessMsg(`${key.replace('_', ' ')} updated successfully!`);
      setTimeout(() => setSuccessMsg(''), 3000);
    } catch (err) {
      alert('Failed to update settings.');
    }
  };

  const addCategory = () => {
    const name = prompt('Enter category name:');
    if (name) {
      const newCats = [...categories, { id: Date.now().toString(), name, slug: name.toLowerCase().replace(/ /g, '-') }];
      setCategories(newCats);
    }
  };

  const deleteCategory = (id) => {
    setCategories(categories.filter(c => c.id !== id));
  };

  const addBanner = () => {
    const title = prompt('Enter banner title:');
    const imageUrl = prompt('Enter image URL:');
    const link = prompt('Enter link URL:');
    if (title && imageUrl) {
      const newBanners = [...banners, { id: Date.now().toString(), title, imageUrl, link }];
      setBanners(newBanners);
    }
  };

  const deleteBanner = (id) => {
    setBanners(banners.filter(b => b.id !== id));
  };

  if (isLoading) return <Container className="py-5 text-center"><Spinner animation="border" /></Container>;

  return (
    <Container className="py-5">
      <h2 className="fw-bold mb-4">Platform Settings</h2>

      {successMsg && (
        <Alert variant="success" className="d-flex align-items-center gap-2">
          <FaCheckCircle /> {successMsg}
        </Alert>
      )}

      <div className="bg-white rounded shadow-sm p-0 overflow-hidden">
        <Tabs defaultActiveKey="categories" id="settings-tabs" className="custom-admin-tabs px-3 pt-2 bg-light border-bottom">
          <Tab eventKey="categories" title={<span><FaLink className="me-2" /> Categories</span>}>
            <div className="p-4">
              <div className="d-flex justify-content-between align-items-center mb-3">
                <h5 className="mb-0 fw-bold">Course Categories</h5>
                <div className="d-flex gap-2">
                  <Button variant="outline-primary" size="sm" onClick={addCategory}><FaPlus className="me-1" /> Add</Button>
                  <Button variant="primary" size="sm" onClick={() => handleSave('categories', categories)} disabled={isUpdating}>
                    <FaSave className="me-1" /> Save Changes
                  </Button>
                </div>
              </div>
              <Table hover responsive className="align-middle">
                <thead className="table-light">
                  <tr>
                    <th>Name</th>
                    <th>Slug</th>
                    <th className="text-end">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {categories.map(cat => (
                    <tr key={cat.id}>
                      <td>{cat.name}</td>
                      <td><code>{cat.slug}</code></td>
                      <td className="text-end">
                        <Button variant="outline-danger" size="sm" onClick={() => deleteCategory(cat.id)}><FaTrash /></Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </Table>
            </div>
          </Tab>

          {/* 1. HERO SECTION */}
          <Tab eventKey="hp_hero" title={<span><FaHome className="me-2" /> Hero</span>}>
            <div className="p-4">
              <div className="d-flex justify-content-between align-items-center mb-3">
                <h5 className="mb-0 fw-bold">Hero Section</h5>
                <Button variant="primary" size="sm" onClick={() => handleSave('hp_hero', hero)} disabled={isUpdating}>
                  <FaSave className="me-1" /> Save Hero
                </Button>
              </div>
              <Form className="row g-3">
                <Form.Group className="col-md-6">
                  <Form.Label className="fw-semibold">Main Title</Form.Label>
                  <Form.Control value={hero.title} onChange={e => setHero({ ...hero, title: e.target.value })} />
                </Form.Group>
                <Form.Group className="col-md-6">
                  <Form.Label className="fw-semibold">Subtitle</Form.Label>
                  <Form.Control value={hero.subtitle} onChange={e => setHero({ ...hero, subtitle: e.target.value })} />
                </Form.Group>
                <Form.Group className="col-md-12">
                  <Form.Label className="fw-semibold">Description</Form.Label>
                  <Form.Control as="textarea" rows={2} value={hero.description} onChange={e => setHero({ ...hero, description: e.target.value })} />
                </Form.Group>
                <Form.Group className="col-md-6">
                  <Form.Label className="fw-semibold">Background Video URL</Form.Label>
                  <Form.Control value={hero.videoUrl} onChange={e => setHero({ ...hero, videoUrl: e.target.value })} />
                </Form.Group>
                <Form.Group className="col-md-3">
                  <Form.Label className="fw-semibold">CTA Button Text</Form.Label>
                  <Form.Control value={hero.ctaText} onChange={e => setHero({ ...hero, ctaText: e.target.value })} />
                </Form.Group>
                <Form.Group className="col-md-3">
                  <Form.Label className="fw-semibold">CTA Button URL</Form.Label>
                  <Form.Control value={hero.ctaUrl} onChange={e => setHero({ ...hero, ctaUrl: e.target.value })} />
                </Form.Group>
              </Form>
            </div>
          </Tab>

          {/* 2. ABOUT SECTION */}
          <Tab eventKey="hp_about" title={<span><FaInfoCircle className="me-2" /> About</span>}>
            <div className="p-4">
              <div className="d-flex justify-content-between align-items-center mb-3">
                <h5 className="mb-0 fw-bold">About Unikriti</h5>
                <Button variant="primary" size="sm" onClick={() => handleSave('hp_about', about)} disabled={isUpdating}>
                  <FaSave className="me-1" /> Save About
                </Button>
              </div>
              <Form className="row g-3 mb-4">
                <Form.Group className="col-md-12">
                  <Form.Label className="fw-semibold">Section Title</Form.Label>
                  <Form.Control value={about.title} onChange={e => setAbout({ ...about, title: e.target.value })} />
                </Form.Group>
                <Form.Group className="col-md-12">
                  <Form.Label className="fw-semibold">Main Description</Form.Label>
                  <Form.Control as="textarea" rows={3} value={about.text} onChange={e => setAbout({ ...about, text: e.target.value })} />
                </Form.Group>
                <Form.Group className="col-md-6">
                  <Form.Label className="fw-semibold">CTA Button Text</Form.Label>
                  <Form.Control value={about.ctaText} onChange={e => setAbout({ ...about, ctaText: e.target.value })} />
                </Form.Group>
                <Form.Group className="col-md-6">
                  <Form.Label className="fw-semibold">CTA Button URL</Form.Label>
                  <Form.Control value={about.ctaUrl} onChange={e => setAbout({ ...about, ctaUrl: e.target.value })} />
                </Form.Group>
                <Form.Group className="col-md-12">
                  <Form.Label className="fw-semibold">Side Image/GIF URL</Form.Label>
                  <Form.Control value={about.imageUrl} onChange={e => setAbout({ ...about, imageUrl: e.target.value })} />
                </Form.Group>
              </Form>

              <div className="d-flex justify-content-between align-items-center mb-2">
                <h6 className="mb-0 fw-bold">Multi Blurbs (Highlights)</h6>
                <Button variant="outline-primary" size="sm" onClick={() => setAbout({ ...about, blurbs: [...(about.blurbs || []), { icon: '🏅', title: '', desc: '' }] })}>
                  <FaPlus className="me-1" /> Add Blurb
                </Button>
              </div>
              <Table size="sm" hover responsive className="align-middle border rounded">
                <thead className="table-light">
                  <tr>
                    <th>Icon</th>
                    <th>Title</th>
                    <th>Description</th>
                    <th className="text-end">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {(about.blurbs || []).map((blurb, bIdx) => (
                    <tr key={bIdx}>
                      <td style={{ width: '60px' }}><Form.Control size="sm" value={blurb.icon} onChange={e => {
                        const newB = [...about.blurbs];
                        newB[bIdx] = { ...blurb, icon: e.target.value };
                        setAbout({ ...about, blurbs: newB });
                      }} /></td>
                      <td><Form.Control size="sm" value={blurb.title} onChange={e => {
                        const newB = [...about.blurbs];
                        newB[bIdx] = { ...blurb, title: e.target.value };
                        setAbout({ ...about, blurbs: newB });
                      }} /></td>
                      <td><Form.Control size="sm" value={blurb.desc} onChange={e => {
                        const newB = [...about.blurbs];
                        newB[bIdx] = { ...blurb, desc: e.target.value };
                        setAbout({ ...about, blurbs: newB });
                      }} /></td>
                      <td className="text-end">
                        <Button variant="outline-danger" size="sm" onClick={() => {
                          const newB = about.blurbs.filter((_, i) => i !== bIdx);
                          setAbout({ ...about, blurbs: newB });
                        }}><FaTrash /></Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </Table>
            </div>
          </Tab>

          {/* 3. TIMELINE */}
          <Tab eventKey="hp_timeline" title={<span><FaCalendarAlt className="me-2" /> Timeline</span>}>
            <div className="p-4">
              <div className="d-flex justify-content-between align-items-center mb-3">
                <h5 className="mb-0 fw-bold">Story Timeline</h5>
                <div className="d-flex gap-2">
                  <Button variant="outline-primary" size="sm" onClick={() => setTimeline([...timeline, { id: Date.now(), year: '', title: '', desc: '' }])}>
                    <FaPlus className="me-1" /> Add Event
                  </Button>
                  <Button variant="primary" size="sm" onClick={() => handleSave('hp_timeline', timeline)} disabled={isUpdating}>
                    <FaSave className="me-1" /> Save Timeline
                  </Button>
                </div>
              </div>
              <Table hover responsive className="align-middle">
                <thead className="table-light">
                  <tr>
                    <th>Year</th>
                    <th>Title</th>
                    <th>Description</th>
                    <th className="text-end">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {timeline.map((item, idx) => (
                    <tr key={item.id || idx}>
                      <td><Form.Control size="sm" value={item.year} onChange={e => {
                        const newT = [...timeline];
                        newT[idx] = { ...item, year: e.target.value };
                        setTimeline(newT);
                      }} /></td>
                      <td><Form.Control size="sm" value={item.title} onChange={e => {
                        const newT = [...timeline];
                        newT[idx] = { ...item, title: e.target.value };
                        setTimeline(newT);
                      }} /></td>
                      <td><Form.Control size="sm" value={item.desc} onChange={e => {
                        const newT = [...timeline];
                        newT[idx] = { ...item, desc: e.target.value };
                        setTimeline(newT);
                      }} /></td>
                      <td className="text-end">
                        <Button variant="outline-danger" size="sm" onClick={() => setTimeline(timeline.filter((_, i) => i !== idx))}><FaTrash /></Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </Table>
            </div>
          </Tab>

          {/* 4. AWARDS */}
          <Tab eventKey="hp_awards" title={<span><FaAward className="me-2" /> Awards</span>}>
            <div className="p-4">
              <div className="d-flex justify-content-between align-items-center mb-3">
                <h5 className="mb-0 fw-bold">Awards & Recognitions</h5>
                <div className="d-flex gap-2">
                  <Button variant="outline-primary" size="sm" onClick={() => setAwards([...awards, { id: Date.now(), img: '', name: '' }])}>
                    <FaPlus className="me-1" /> Add Award
                  </Button>
                  <Button variant="primary" size="sm" onClick={() => handleSave('hp_awards', awards)} disabled={isUpdating}>
                    <FaSave className="me-1" /> Save Awards
                  </Button>
                </div>
              </div>
              <div className="row g-3">
                {awards.map((award, idx) => (
                  <div className="col-md-6" key={award.id || idx}>
                    <div className="p-3 border rounded bg-light">
                      <Form.Group className="mb-2">
                        <Form.Label className="small fw-semibold">Award Name</Form.Label>
                        <Form.Control size="sm" value={award.name} onChange={e => {
                          const newA = [...awards];
                          newA[idx] = { ...award, name: e.target.value };
                          setAwards(newA);
                        }} />
                      </Form.Group>
                      <Form.Group className="mb-2">
                        <Form.Label className="small fw-semibold">Image URL</Form.Label>
                        <Form.Control size="sm" value={award.img} onChange={e => {
                          const newA = [...awards];
                          newA[idx] = { ...award, img: e.target.value };
                          setAwards(newA);
                        }} />
                      </Form.Group>
                      <Form.Group className="mb-2">
                        <Form.Label className="small fw-semibold">Short Description</Form.Label>
                        <Form.Control size="sm" as="textarea" rows={2} value={award.desc} onChange={e => {
                          const newA = [...awards];
                          newA[idx] = { ...award, desc: e.target.value };
                          setAwards(newA);
                        }} />
                      </Form.Group>
                      <div className="text-end">
                        <Button variant="outline-danger" size="sm" onClick={() => setAwards(awards.filter((_, i) => i !== idx))}>Remove</Button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </Tab>

          {/* 5. TEAM */}
          <Tab eventKey="hp_team" title={<span><FaUsers className="me-2" /> Team</span>}>
            <div className="p-4">
              <div className="d-flex justify-content-between align-items-center mb-3">
                <h5 className="mb-0 fw-bold">Our Team</h5>
                <div className="d-flex gap-2">
                  <Button variant="outline-primary" size="sm" onClick={() => setTeam([...team, { id: Date.now(), name: '', role: '', img: '', x: 50, y: 50 }])}>
                    <FaPlus className="me-1" /> Add Member
                  </Button>
                  <Button variant="primary" size="sm" onClick={() => handleSave('hp_team', team)} disabled={isUpdating}>
                    <FaSave className="me-1" /> Save Team
                  </Button>
                </div>
              </div>
              <Table hover responsive className="align-middle">
                <thead className="table-light">
                  <tr>
                    <th>Name</th>
                    <th>Role</th>
                    <th>Image URL</th>
                    <th className="text-end">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {team.map((member, idx) => (
                    <tr key={member.id || idx}>
                      <td><Form.Control size="sm" value={member.name} onChange={e => {
                        const newT = [...team];
                        newT[idx] = { ...member, name: e.target.value };
                        setTeam(newT);
                      }} /></td>
                      <td><Form.Control size="sm" value={member.role} onChange={e => {
                        const newT = [...team];
                        newT[idx] = { ...member, role: e.target.value };
                        setTeam(newT);
                      }} /></td>
                      <td><Form.Control size="sm" value={member.img} onChange={e => {
                        const newT = [...team];
                        newT[idx] = { ...member, img: e.target.value };
                        setTeam(newT);
                      }} /></td>
                      <td className="text-end">
                        <Button variant="outline-danger" size="sm" onClick={() => setTeam(team.filter((_, i) => i !== idx))}><FaTrash /></Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </Table>
            </div>
          </Tab>

          {/* 6. TESTIMONIALS */}
          <Tab eventKey="hp_testimonials" title={<span><FaQuoteLeft className="me-2" /> Reviews</span>}>
            <div className="p-4">
              <div className="d-flex justify-content-between align-items-center mb-3">
                <h5 className="mb-0 fw-bold">Testimonials</h5>
                <div className="d-flex gap-2">
                  <Button variant="outline-primary" size="sm" onClick={() => setTestimonials([...testimonials, { id: Date.now(), name: '', role: '', text: '', rating: 5 }])}>
                    <FaPlus className="me-1" /> Add Review
                  </Button>
                  <Button variant="primary" size="sm" onClick={() => handleSave('hp_testimonials', testimonials)} disabled={isUpdating}>
                    <FaSave className="me-1" /> Save Reviews
                  </Button>
                </div>
              </div>
              {testimonials.map((t, idx) => (
                <div className="p-3 border rounded mb-3 bg-light shadow-sm" key={t.id || idx}>
                  <div className="row g-2">
                    <div className="col-md-4">
                      <Form.Control size="sm" placeholder="Name" value={t.name} onChange={e => {
                        const newT = [...testimonials];
                        newT[idx] = { ...t, name: e.target.value };
                        setTestimonials(newT);
                      }} />
                    </div>
                    <div className="col-md-4">
                      <Form.Control size="sm" placeholder="Role (e.g. Student)" value={t.role} onChange={e => {
                        const newT = [...testimonials];
                        newT[idx] = { ...t, role: e.target.value };
                        setTestimonials(newT);
                      }} />
                    </div>
                    <div className="col-md-6">
                      <Form.Control size="sm" placeholder="Image URL" value={t.img} onChange={e => {
                        const newT = [...testimonials];
                        newT[idx] = { ...t, img: e.target.value };
                        setTestimonials(newT);
                      }} />
                    </div>
                    <div className="col-md-6">
                      <Form.Select size="sm" value={t.rating} onChange={e => {
                        const newT = [...testimonials];
                        newT[idx] = { ...t, rating: parseInt(e.target.value) };
                        setTestimonials(newT);
                      }}>
                        {[5, 4, 3, 2, 1].map(v => <option key={v} value={v}>{v} Stars</option>)}
                      </Form.Select>
                    </div>
                    <div className="col-12">
                      <Form.Control as="textarea" size="sm" rows={2} placeholder="Review Text" value={t.text} onChange={e => {
                        const newT = [...testimonials];
                        newT[idx] = { ...t, text: e.target.value };
                        setTestimonials(newT);
                      }} />
                    </div>
                    <div className="col-12 text-end">
                      <Button variant="link" className="text-danger p-0 d-flex align-items-center gap-1 ms-auto" onClick={() => setTestimonials(testimonials.filter((_, i) => i !== idx))}>
                        <FaTrash size={12} /> Delete
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </Tab>

          {/* 7. FAQ */}
          <Tab eventKey="hp_faqs" title={<span><FaQuestionCircle className="me-2" /> FAQ</span>}>
            <div className="p-4">
              <div className="d-flex justify-content-between align-items-center mb-3">
                <h5 className="mb-0 fw-bold">Frequently Asked Questions</h5>
                <div className="d-flex gap-2">
                  <Button variant="outline-primary" size="sm" onClick={() => setFaqs([...faqs, { id: Date.now(), q: '', a: '' }])}>
                    <FaPlus className="me-1" /> Add FAQ
                  </Button>
                  <Button variant="primary" size="sm" onClick={() => handleSave('hp_faqs', faqs)} disabled={isUpdating}>
                    <FaSave className="me-1" /> Save FAQs
                  </Button>
                </div>
              </div>
              {faqs.map((f, idx) => (
                <div className="p-3 border rounded mb-3 bg-light" key={f.id || idx}>
                  <Form.Group className="mb-2">
                    <Form.Label className="small fw-semibold">Question</Form.Label>
                    <Form.Control size="sm" value={f.q} onChange={e => {
                      const newF = [...faqs];
                      newF[idx] = { ...f, q: e.target.value };
                      setFaqs(newF);
                    }} />
                  </Form.Group>
                  <Form.Group className="mb-2">
                    <Form.Label className="small fw-semibold">Answer</Form.Label>
                    <Form.Control as="textarea" size="sm" rows={2} value={f.a} onChange={e => {
                      const newF = [...faqs];
                      newF[idx] = { ...f, a: e.target.value };
                      setFaqs(newF);
                    }} />
                  </Form.Group>
                  <Button variant="outline-danger" size="sm" onClick={() => setFaqs(faqs.filter((_, i) => i !== idx))}>Remove</Button>
                </div>
              ))}
            </div>
          </Tab>

          {/* 8. CONTACT */}
          <Tab eventKey="hp_contact" title={<span><FaEnvelope className="me-2" /> Contact</span>}>
            <div className="p-4">
              <div className="d-flex justify-content-between align-items-center mb-3">
                <h5 className="mb-0 fw-bold">Contact & Social Settings</h5>
                <Button variant="primary" size="sm" onClick={() => handleSave('hp_contact', contact)} disabled={isUpdating}>
                  <FaSave className="me-1" /> Save Contact
                </Button>
              </div>

              <div className="row g-4">
                <div className="col-lg-7">
                  <div className="p-3 border rounded bg-light mb-4 shadow-sm">
                    <h6 className="fw-bold mb-3 border-bottom pb-2 d-flex align-items-center gap-2">
                      <FaEnvelope size={14} className="text-primary" /> Basic Information
                    </h6>
                    <Form className="row g-3">
                      <Form.Group className="col-md-6">
                        <Form.Label className="fw-semibold small">Email Address</Form.Label>
                        <Form.Control value={contact.email} onChange={e => setContact({ ...contact, email: e.target.value })} />
                      </Form.Group>
                      <Form.Group className="col-md-6">
                        <Form.Label className="fw-semibold small">Phone Number</Form.Label>
                        <Form.Control value={contact.phone} onChange={e => setContact({ ...contact, phone: e.target.value })} />
                      </Form.Group>
                      <Form.Group className="col-md-12">
                        <Form.Label className="fw-semibold small">Office Address</Form.Label>
                        <Form.Control as="textarea" rows={2} value={contact.address} onChange={e => setContact({ ...contact, address: e.target.value })} />
                      </Form.Group>
                    </Form>
                  </div>

                  <div className="p-3 border rounded bg-light shadow-sm">
                    <h6 className="fw-bold mb-3 border-bottom pb-2 d-flex align-items-center gap-2">
                      <FaLink size={14} className="text-primary" /> Social Media Links
                    </h6>
                    <Form className="row g-3">
                      <Form.Group className="col-md-12">
                        <Form.Label className="fw-semibold small d-flex align-items-center gap-2">
                          <FaFacebook className="text-primary" /> Facebook URL
                        </Form.Label>
                        <Form.Control value={contact.facebook} placeholder="https://facebook.com/..." onChange={e => setContact({ ...contact, facebook: e.target.value })} />
                      </Form.Group>
                      <Form.Group className="col-md-12">
                        <Form.Label className="fw-semibold small d-flex align-items-center gap-2">
                          <FaInstagram className="text-danger" /> Instagram URL
                        </Form.Label>
                        <Form.Control value={contact.instagram} placeholder="https://instagram.com/..." onChange={e => setContact({ ...contact, instagram: e.target.value })} />
                      </Form.Group>
                      <Form.Group className="col-md-12">
                        <Form.Label className="fw-semibold small d-flex align-items-center gap-2">
                          <FaLinkedin className="text-primary" /> LinkedIn URL
                        </Form.Label>
                        <Form.Control value={contact.linkedin} placeholder="https://linkedin.com/in/..." onChange={e => setContact({ ...contact, linkedin: e.target.value })} />
                      </Form.Group>
                    </Form>
                  </div>
                </div>

                <div className="col-lg-5">
                  <div className="p-3 border rounded bg-light h-100 shadow-sm">
                    <h6 className="fw-bold mb-3 border-bottom pb-2 d-flex align-items-center gap-2">
                      <FaMapMarkerAlt size={14} className="text-primary" /> Map Integration
                    </h6>
                    <Form.Group className="mb-3">
                      <Form.Label className="fw-semibold small">Google Maps Embed URL</Form.Label>
                      <Form.Control 
                        as="textarea" 
                        rows={5} 
                        value={contact.mapEmbed} 
                        placeholder="Paste the 'src' URL from the Google Maps iframe embed code here"
                        onChange={e => setContact({ ...contact, mapEmbed: e.target.value })} 
                      />
                      <Form.Text className="text-muted small mt-2 d-block">
                        Go to Google Maps → Share → Embed a map → Copy only the <code>src</code> URL inside the iframe.
                      </Form.Text>
                    </Form.Group>
                    {contact.mapEmbed && (
                      <div className="mt-3 border rounded overflow-hidden" style={{ height: '200px' }}>
                        <iframe 
                          src={contact.mapEmbed} 
                          width="100%" 
                          height="100%" 
                          style={{ border: 0 }} 
                          allowFullScreen="" 
                          loading="lazy"
                        />
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </Tab>
          {/* 9. THEME & SEO */}
          <Tab eventKey="hp_theme" title={<span><FaPalette className="me-2" /> Theme & SEO</span>}>
            <div className="p-4">
              <div className="d-flex justify-content-between align-items-center mb-3">
                <h5 className="mb-0 fw-bold">General Theme & Global SEO</h5>
                <Button variant="primary" size="sm" onClick={() => handleSave('hp_theme', theme)} disabled={isUpdating}>
                  <FaSave className="me-1" /> Save Theme
                </Button>
              </div>
              
              <div className="row g-4">
                <div className="col-lg-6">
                  <div className="p-3 border rounded bg-light mb-4 shadow-sm">
                    <h6 className="fw-bold mb-3 border-bottom pb-2 d-flex align-items-center gap-2">
                      <FaGlobe size={14} className="text-primary" /> Website Identity
                    </h6>
                    <Form className="row g-3">
                      <Form.Group className="col-12">
                        <Form.Label className="fw-semibold small">Website Name</Form.Label>
                        <Form.Control value={theme.siteName} onChange={e => setTheme({ ...theme, siteName: e.target.value })} placeholder="e.g. NextLMS" />
                      </Form.Group>
                      <Form.Group className="col-12">
                        <Form.Label className="fw-semibold small">Website Logo URL</Form.Label>
                        <div className="d-flex gap-2 align-items-start">
                          <Form.Control value={theme.siteLogo} onChange={e => setTheme({ ...theme, siteLogo: e.target.value })} placeholder="https://..." />
                          {theme.siteLogo && (
                            <div className="border rounded p-1 bg-white" style={{ width: '40px', height: '40px' }}>
                              <img src={theme.siteLogo} alt="Preview" style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
                            </div>
                          )}
                        </div>
                      </Form.Group>
                      <Form.Group className="col-12">
                        <Form.Label className="fw-semibold small">Favicon Image URL</Form.Label>
                        <div className="d-flex gap-2 align-items-start">
                          <Form.Control value={theme.faviconUrl} onChange={e => setTheme({ ...theme, faviconUrl: e.target.value })} placeholder="https://.../favicon.png" />
                          {theme.faviconUrl && (
                            <div className="border rounded p-1 bg-white d-flex align-items-center justify-content-center" style={{ width: '40px', height: '40px' }}>
                              <img src={theme.faviconUrl} alt="Favicon preview" style={{ width: '20px', height: '20px', objectFit: 'contain' }} />
                            </div>
                          )}
                        </div>
                      </Form.Group>
                    </Form>
                  </div>

                  <div className="p-3 border rounded bg-light shadow-sm">
                    <h6 className="fw-bold mb-3 border-bottom pb-2 d-flex align-items-center gap-2">
                      <FaLink size={14} className="text-primary" /> Custom Scripts
                    </h6>
                    <Form className="row g-3">
                      <Form.Group className="col-12">
                        <Form.Label className="fw-semibold small">Header Scripts (Google Analytics, Pixels, etc.)</Form.Label>
                        <Form.Control as="textarea" rows={4} value={theme.customHeadScripts} onChange={e => setTheme({ ...theme, customHeadScripts: e.target.value })} placeholder="<script>...</script>" />
                      </Form.Group>
                      <Form.Group className="col-12">
                        <Form.Label className="fw-semibold small">Footer Scripts</Form.Label>
                        <Form.Control as="textarea" rows={4} value={theme.customFooterScripts} onChange={e => setTheme({ ...theme, customFooterScripts: e.target.value })} placeholder="<script>...</script>" />
                      </Form.Group>
                    </Form>
                  </div>
                </div>

                <div className="col-lg-6">
                  <div className="p-3 border rounded bg-light h-100 shadow-sm">
                    <h6 className="fw-bold mb-3 border-bottom pb-2 d-flex align-items-center gap-2">
                       SEO Configuration (Global Tags)
                    </h6>
                    <Form className="row g-3">
                      <Form.Group className="col-12">
                        <Form.Label className="fw-semibold small">Global Meta Title</Form.Label>
                        <Form.Control value={theme.metaTitle} onChange={e => setTheme({ ...theme, metaTitle: e.target.value })} placeholder="Default title for the whole site" />
                        <Form.Text className="text-muted small">This is used when a specific page doesn&apos;t have its own SEO title.</Form.Text>
                      </Form.Group>
                      <Form.Group className="col-12">
                        <Form.Label className="fw-semibold small">Global Meta Description</Form.Label>
                        <Form.Control as="textarea" rows={3} value={theme.metaDescription} onChange={e => setTheme({ ...theme, metaDescription: e.target.value })} placeholder="Global description for search engines" />
                      </Form.Group>
                      <Form.Group className="col-12">
                        <Form.Label className="fw-semibold small">Global Meta Keywords</Form.Label>
                        <Form.Control as="textarea" rows={2} value={theme.metaKeywords} onChange={e => setTheme({ ...theme, metaKeywords: e.target.value })} placeholder="keyword1, keyword2, keyword3" />
                      </Form.Group>
                    </Form>
                  </div>
                </div>
              </div>

              <div className="mt-4 p-3 border rounded-3 bg-light shadow-sm">
                <div className="d-flex justify-content-between align-items-start">
                  <div>
                    <h6 className="fw-bold mb-1 d-flex align-items-center gap-2">
                      Signup User On Login Page
                    </h6>
                    <p className="small text-muted mb-1">When enabled, new students can create an account from the login page using OTP. Existing students can still sign in when this is disabled.</p>
                  </div>
                  <Form.Check
                    type="switch"
                    id="toggle-login-signup"
                    checked={loginSignupEnabled}
                    onChange={e => {
                      setLoginSignupEnabled(e.target.checked);
                      handleSave('login_signup_enabled', e.target.checked);
                    }}
                    className="ms-3 mt-1"
                  />
                </div>
                <span className={`badge ${loginSignupEnabled ? 'bg-success' : 'bg-secondary'}`}>
                  {loginSignupEnabled ? 'Signup Enabled' : 'Signup Blocked'}
                </span>
              </div>

              {/* Developer Options */}
              <div className="mt-4 p-3 border rounded-3 bg-light shadow-sm">
                <div className="d-flex justify-content-between align-items-center mb-3">
                  <h6 className="fw-bold mb-0 d-flex align-items-center gap-2">
                    <FaEnvelope size={14} className="text-primary" /> Email SMTP Configuration
                  </h6>
                  <Button variant="primary" size="sm" onClick={() => handleSave('email_smtp', emailSmtp)} disabled={isUpdating}>
                    <FaSave className="me-1" /> Save Email SMTP
                  </Button>
                </div>
                <Form className="row g-3">
                  <Form.Group className="col-md-3">
                    <Form.Label className="fw-semibold small">Enable Email Sending</Form.Label>
                    <Form.Check
                      type="switch"
                      id="email-smtp-enabled"
                      label={emailSmtp.enabled ? 'Enabled' : 'Disabled'}
                      checked={Boolean(emailSmtp.enabled)}
                      onChange={e => setEmailSmtp({ ...emailSmtp, enabled: e.target.checked })}
                    />
                  </Form.Group>
                  <Form.Group className="col-md-6">
                    <Form.Label className="fw-semibold small">SMTP Host</Form.Label>
                    <Form.Control value={emailSmtp.host} onChange={e => setEmailSmtp({ ...emailSmtp, host: e.target.value })} placeholder="smtp.gmail.com" />
                  </Form.Group>
                  <Form.Group className="col-md-3">
                    <Form.Label className="fw-semibold small">SMTP Port</Form.Label>
                    <Form.Control type="number" value={emailSmtp.port} onChange={e => setEmailSmtp({ ...emailSmtp, port: Number(e.target.value || 587) })} />
                  </Form.Group>
                  <Form.Group className="col-md-3">
                    <Form.Label className="fw-semibold small">Secure SSL</Form.Label>
                    <Form.Check
                      type="switch"
                      id="email-smtp-secure"
                      label={emailSmtp.secure ? 'SSL/TLS' : 'STARTTLS/Plain'}
                      checked={Boolean(emailSmtp.secure)}
                      onChange={e => setEmailSmtp({ ...emailSmtp, secure: e.target.checked })}
                    />
                  </Form.Group>
                  <Form.Group className="col-md-4">
                    <Form.Label className="fw-semibold small">SMTP Username</Form.Label>
                    <Form.Control value={emailSmtp.username} onChange={e => setEmailSmtp({ ...emailSmtp, username: e.target.value })} autoComplete="off" />
                  </Form.Group>
                  <Form.Group className="col-md-5">
                    <Form.Label className="fw-semibold small">SMTP Password / App Password</Form.Label>
                    <Form.Control type="password" value={emailSmtp.password} onChange={e => setEmailSmtp({ ...emailSmtp, password: e.target.value })} autoComplete="new-password" />
                  </Form.Group>
                  <Form.Group className="col-md-4">
                    <Form.Label className="fw-semibold small">From Name</Form.Label>
                    <Form.Control value={emailSmtp.fromName} onChange={e => setEmailSmtp({ ...emailSmtp, fromName: e.target.value })} placeholder="Unikriti Admissions" />
                  </Form.Group>
                  <Form.Group className="col-md-4">
                    <Form.Label className="fw-semibold small">From Email</Form.Label>
                    <Form.Control type="email" value={emailSmtp.fromEmail} onChange={e => setEmailSmtp({ ...emailSmtp, fromEmail: e.target.value })} placeholder="admissions@example.com" />
                  </Form.Group>
                  <Form.Group className="col-md-4">
                    <Form.Label className="fw-semibold small">Reply-To Email</Form.Label>
                    <Form.Control type="email" value={emailSmtp.replyTo} onChange={e => setEmailSmtp({ ...emailSmtp, replyTo: e.target.value })} placeholder="support@example.com" />
                  </Form.Group>
                  <Form.Group className="col-md-8">
                    <Form.Label className="fw-semibold small">Admin Notification Emails</Form.Label>
                    <Form.Control value={emailSmtp.adminEmails} onChange={e => setEmailSmtp({ ...emailSmtp, adminEmails: e.target.value })} placeholder="admin@example.com, accounts@example.com" />
                    <Form.Text className="text-muted">Separate multiple admin emails with commas.</Form.Text>
                  </Form.Group>
                  <Form.Group className="col-md-4">
                    <Form.Label className="fw-semibold small">Subject Prefix</Form.Label>
                    <Form.Control value={emailSmtp.subjectPrefix} onChange={e => setEmailSmtp({ ...emailSmtp, subjectPrefix: e.target.value })} placeholder="[Unikriti]" />
                  </Form.Group>
                  <Form.Group className="col-12">
                    <Form.Label className="fw-semibold small">Custom Email CSS</Form.Label>
                    <Form.Control
                      as="textarea"
                      rows={6}
                      value={emailSmtp.customCss}
                      onChange={e => setEmailSmtp({ ...emailSmtp, customCss: e.target.value })}
                      placeholder=".email-card { border-radius: 18px; } .email-hero { background: #111827; }"
                    />
                    <Form.Text className="text-muted">Applied inside confirmation emails so you can style the email UI.</Form.Text>
                  </Form.Group>
                </Form>
              </div>

              <div className="mt-4 p-3 border rounded-3 bg-light shadow-sm">
                <div className="d-flex justify-content-between align-items-start">
                  <div>
                    <h6 className="fw-bold mb-1 d-flex align-items-center gap-2">
                      🧪 Show Test OTP <span className="badge bg-warning text-dark small fw-normal">Dev Only</span>
                    </h6>
                    <p className="small text-muted mb-1">When enabled, the OTP is shown as a toast notification on the course enrollment page. <strong>Disable in production.</strong></p>
                  </div>
                  <Form.Check
                    type="switch"
                    id="toggle-show-test-otp"
                    checked={showTestOtp}
                    onChange={e => {
                      setShowTestOtp(e.target.checked);
                      handleSave('show_test_otp', e.target.checked);
                    }}
                    className="ms-3 mt-1"
                  />
                </div>
                <span className={`badge ${showTestOtp ? 'bg-success' : 'bg-secondary'}`}>
                  {showTestOtp ? 'OTP Visible' : 'OTP Hidden'}
                </span>
              </div>
            </div>
          </Tab>
          {/* 10. PAYMENTS */}
          <Tab eventKey="payments" title={<span><FaCreditCard className="me-2" /> Payments</span>}>
            <div className="p-4">
              <div className="d-flex justify-content-between align-items-center mb-4">
                <h5 className="mb-0 fw-bold">Payment Mode Settings</h5>
                <Button
                  variant="primary"
                  size="sm"
                  disabled={isUpdating}
                  onClick={async () => {
                    await handleSave('payment_mode_online', paymentModeOnline);
                    await handleSave('payment_mode_later', paymentModeLater);
                    await handleSave('payment_gateway', paymentGateway);
                  }}
                >
                  <FaSave className="me-1" /> Save Payment Settings
                </Button>
              </div>
              <div className="mb-4 p-3 border rounded-3 bg-light shadow-sm">
                <Form.Label className="fw-semibold mb-2">Online Payment Gateway</Form.Label>
                <Form.Select
                  value={paymentGateway}
                  onChange={(e) => setPaymentGateway(e.target.value)}
                  disabled={!paymentModeOnline}
                >
                  <option value="stripe">Stripe</option>
                  <option value="razorpay">Razorpay</option>
                  <option value="icici">ICICI Payment Gateway</option>
                </Form.Select>
                <p className="small text-muted mt-2 mb-0">
                  This gateway is used when students choose online payment.
                </p>
              </div>
              <div className="row g-4">
                <div className="col-md-6">
                  <div className="p-4 border rounded-3 bg-light shadow-sm h-100">
                    <div className="d-flex justify-content-between align-items-start mb-2">
                      <div>
                        <h6 className="fw-bold mb-1">💳 Pay Online</h6>
                        <p className="small text-muted mb-0">Allow students to pay immediately via the configured payment gateway (Razorpay / Stripe / ICICI).</p>
                      </div>
                      <Form.Check
                        type="switch"
                        id="toggle-pay-online"
                        checked={paymentModeOnline}
                        onChange={e => setPaymentModeOnline(e.target.checked)}
                        className="ms-3 mt-1"
                      />
                    </div>
                    {paymentModeOnline ? (
                      <span className="badge bg-success">Enabled</span>
                    ) : (
                      <span className="badge bg-secondary">Disabled</span>
                    )}
                  </div>
                </div>
                <div className="col-md-6">
                  <div className="p-4 border rounded-3 bg-light shadow-sm h-100">
                    <div className="d-flex justify-content-between align-items-start mb-2">
                      <div>
                        <h6 className="fw-bold mb-1">🕒 Pay Later</h6>
                        <p className="small text-muted mb-0">Allow students to reserve a course without paying now. Your team will follow up to collect payment.</p>
                      </div>
                      <Form.Check
                        type="switch"
                        id="toggle-pay-later"
                        checked={paymentModeLater}
                        onChange={e => setPaymentModeLater(e.target.checked)}
                        className="ms-3 mt-1"
                      />
                    </div>
                    {paymentModeLater ? (
                      <span className="badge bg-success">Enabled</span>
                    ) : (
                      <span className="badge bg-secondary">Disabled</span>
                    )}
                  </div>
                </div>
              </div>
              {!paymentModeOnline && !paymentModeLater && (
                <div className="alert alert-warning mt-4 small">
                  ⚠️ Warning: At least one payment mode must be enabled, otherwise students won&apos;t be able to enroll.
                </div>
              )}
            </div>
          </Tab>
        </Tabs>
      </div>
    </Container>
  );
}
