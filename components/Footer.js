'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

const isPrefetchablePath = (url) => typeof url === 'string' && url.startsWith('/') && !url.startsWith('//');

const Footer = ({ initialMenus = [], theme = {}, contact = {} }) => {
  const router = useRouter();
  const [footerMenus, setFooterMenus] = useState([]);
  const [flatMenus, setFlatMenus] = useState([]);

  useEffect(() => {
    const processMenus = (data) => {
      setFlatMenus(data);
      const allFooterItems = data.filter(m => m.isActive && m.type === 'footer');
      const parents = allFooterItems.filter(m => m.parentId === null).sort((a, b) => a.order - b.order);
      setFooterMenus(parents);
    };

    if (initialMenus.length > 0) {
      processMenus(initialMenus);
      return;
    }

    const fetchMenus = async () => {
      try {
        const res = await fetch('/api/admin/menus');
        const data = await res.json();
        if (data.success) {
          processMenus(data.data);
        }
      } catch (error) {
        console.error('Failed to fetch footer menus:', error);
      }
    };
    fetchMenus();
  }, [initialMenus]);

  const prefetchRoute = (url) => {
    if (!isPrefetchablePath(url)) return;
    router.prefetch(url);
  };

  useEffect(() => {
    if (!flatMenus.length) return;

    const uniqueUrls = [...new Set(
      flatMenus
        .map((menu) => menu.url)
        .filter(isPrefetchablePath)
    )].slice(0, 10);

    const timeoutId = window.setTimeout(() => {
      uniqueUrls.forEach((url) => router.prefetch(url));
    }, 500);

    return () => window.clearTimeout(timeoutId);
  }, [flatMenus, router]);
  return (
    <footer className="u-footer py-5">
      <div className="container">
        <div className="u-footer-top">
          <div>
            <div className="u-brand">{theme.siteName || 'UNIKRITI'}</div>
            <p className="u-foot-p">
              Unikriti School of Performing Arts — online &amp; offline music
              programs with a structured roadmap, performance confidence and
              certification options.
            </p>
          </div>
          <div className="u-news">
            <div className='text-center'>
   <Link className="u-brand" href="/">
                    {theme?.siteLogo ? (
                      <img src={theme.siteLogo} alt={theme.siteName || 'Logo'} className='mx-auto' style={{ maxHeight: '80px' ,width:'auto'}} />
                    ) : (
                      theme?.siteName || 'UNIKRITI'
                    )}
                  </Link>
        
            <div className="u-social social-links justify-content-center">
  {contact.facebook && (
    <a href={contact.facebook} target="_blank" rel="noopener noreferrer" aria-label="Facebook">
      <i className="bi bi-facebook"></i>
    </a>
  )}

  {contact.instagram && (
    <a href={contact.instagram} target="_blank" rel="noopener noreferrer" aria-label="Instagram">
      <i className="bi bi-instagram"></i>
    </a>
  )}

  {contact.linkedin && (
    <a href={contact.linkedin} target="_blank" rel="noopener noreferrer" aria-label="LinkedIn">
      <i className="bi bi-linkedin"></i>
    </a>
  )}
</div>

            </div>
      
          
          </div>
        </div>
        <div className="row g-4 mt-4">
          {Array.isArray(footerMenus) && footerMenus.map((column) => (
            <div className="col-md-3" key={column._id}>
              <h6 className="u-foot-h">{column.title}</h6>
              {(() => {
                const renderFooterLinks = (parentId) => {
                  const children = flatMenus.filter(m => m.parentId === parentId && m.isActive).sort((a, b) => a.order - b.order);
                  if (children.length === 0) return null;
                  return (
                    <ul className={`u-foot-links list-unstyled ${parentId !== column._id ? 'ms-3' : ''}`}>
                      {children.map(item => (
                        <li key={item._id} className="mb-2">
                          <Link href={item.url} className="u-foot-link text-white text-decoration-none" prefetch onMouseEnter={() => prefetchRoute(item.url)} onFocus={() => prefetchRoute(item.url)}>
                            {item.title}
                          </Link>
                          {renderFooterLinks(item._id)}
                        </li>
                      ))}
                    </ul>
                  );
                };
                return renderFooterLinks(column._id);
              })()}
            </div>
          ))}



          <div className="col-md-3">
            <h6 className="u-foot-h">Centers</h6>
            <div className="u-center-card">
              <div className="u-center-line">
                <span>📍</span> OPG World School, Dwarka
              </div>
              <div className="u-center-line">
                <span>📍</span> Prakriti School, Noida
              </div>
              <a className="u-center-btn" href="#">
                View all locations →
              </a>
            </div>
          </div>
        </div>
        <div className="u-bottom mt-4 pt-3">
          <div>
            © <span id="yr">{new Date().getFullYear()}</span> {theme.siteName || 'Unikriti'}. All rights reserved. Website
            Design by <a href="http://seotowebdesign.com/" target="_blank" rel="noopener noreferrer">SEO To Webdeisgn</a>
          </div>
          <div className="u-bottom-links">
            <a href="#">Terms</a>
            <a href="#">Privacy</a>
            <a href="#">Sitemap</a>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
