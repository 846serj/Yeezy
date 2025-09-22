'use client';

import React, { useState, useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';

interface TuiNavbarProps {
  className?: string;
}

export const TuiNavbar: React.FC<TuiNavbarProps> = ({ className = '' }) => {
  const router = useRouter();
  const pathname = usePathname();
  const { user, logout } = useAuth();
  const [currentTime, setCurrentTime] = useState(new Date());

  // Update time every second
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: true
    });
  };

  const isActive = (path: string) => {
    return pathname === path ? 'active' : '';
  };

  const handleLogout = async () => {
    await logout();
    router.push('/');
  };

  return (
    <nav className={`tui-nav ${className}`}>
      {/* Clock */}
      <span className="tui-datetime">
        {formatTime(currentTime)}
      </span>
      
      {/* Navigation Menu */}
      <ul>
        <li className={isActive('/')}>
          <a href="/" onClick={(e) => { e.preventDefault(); router.push('/'); }}>
            <span className="green-255-text">H</span>ome
          </a>
        </li>
        
        <li className={isActive('/dashboard')}>
          <a href="/dashboard" onClick={(e) => { e.preventDefault(); router.push('/dashboard'); }}>
            <span className="cyan-255-text">D</span>ashboard
          </a>
        </li>
        
        <li className={isActive('/editor')}>
          <a href="/editor" onClick={(e) => { e.preventDefault(); router.push('/editor'); }}>
            <span className="yellow-255-text">E</span>ditor
          </a>
        </li>
        
        <li className={isActive('/generate')}>
          <a href="/generate" onClick={(e) => { e.preventDefault(); router.push('/generate'); }}>
            <span className="purple-255-text">G</span>enerate
          </a>
        </li>
        
        <li className={isActive('/tuicss-demo')}>
          <a href="/tuicss-demo" onClick={(e) => { e.preventDefault(); router.push('/tuicss-demo'); }}>
            <span className="red-255-text">T</span>uiCss Demo
          </a>
        </li>
      </ul>

      {/* User Menu Dropdown */}
      {user && (
        <ul className="right">
          <li className="tui-dropdown">
            <span className="blue-255-text">U</span>ser
            <div className="tui-dropdown-content">
              <ul>
                <li>
                  <a href="#!" onClick={(e) => { e.preventDefault(); }}>
                    <span className="green-255-text">P</span>rofile
                  </a>
                </li>
                <li>
                  <a href="#!" onClick={(e) => { e.preventDefault(); }}>
                    <span className="cyan-255-text">S</span>ettings
                  </a>
                </li>
                <li>
                  <a href="#!" onClick={(e) => { e.preventDefault(); handleLogout(); }}>
                    <span className="red-255-text">L</span>ogout
                  </a>
                </li>
              </ul>
            </div>
          </li>
        </ul>
      )}
    </nav>
  );
};

export default TuiNavbar;
