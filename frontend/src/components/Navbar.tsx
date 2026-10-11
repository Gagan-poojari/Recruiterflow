import React from 'react';
import { NavLink } from 'react-router-dom';

export const Navbar: React.FC = () => {
  return (
    <header className="site-header">
      <div className="header-inner">
        <div className="brand">
          <NavLink to="/" className="brand-link">Trip Splitter</NavLink>
        </div>
        <nav className="nav-links" aria-label="Main navigation">
          <NavLink
            to="/"
            end
            className={({ isActive }) => (isActive ? 'nav-item active' : 'nav-item')}
          >
            Expenses
          </NavLink>
          <NavLink
            to="/expenses/new"
            className={({ isActive }) => (isActive ? 'nav-item active' : 'nav-item')}
          >
            Add Expense
          </NavLink>
        </nav>
      </div>
    </header>
  );
};
