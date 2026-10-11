import React from 'react';
import { Link } from 'react-router-dom';

export const NotFoundPage: React.FC = () => {
  return (
    <div className="page-container">
      <div className="section-card text-center not-found-box">
        <h2>Page not found</h2>
        <p className="text-muted">The page you requested does not exist.</p>
        <div style={{ marginTop: '1.5rem' }}>
          <Link to="/" className="btn btn-primary">
            Back to Expenses
          </Link>
        </div>
      </div>
    </div>
  );
};
