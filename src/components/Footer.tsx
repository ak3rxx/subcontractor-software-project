
import React from 'react';
import { Link } from 'react-router-dom';

const Footer = () => {
  return (
    <footer className="bg-gray-900 text-white">
      <div className="container px-4 py-12 mx-auto">
        <div className="grid grid-cols-1 gap-8 md:grid-cols-4">
          <div>
            <div className="flex items-center gap-2 mb-4">
              <div className="flex items-center justify-center w-10 h-10 rounded-md bg-construction-blue">
                <span className="text-xl font-bold text-white">CB</span>
              </div>
              <h2 className="text-xl font-bold">ConstructBuild</h2>
            </div>
            <p className="text-gray-400">
              Streamlining construction business management with comprehensive software solutions.
            </p>
          </div>
          
          <div>
            <h3 className="mb-4 text-lg font-semibold">Platform</h3>
            <ul className="space-y-2">
              <li><Link to="/dashboard" className="text-gray-400 hover:text-construction-yellow transition-colors">Dashboard</Link></li>
              <li><Link to="/projects" className="text-gray-400 hover:text-construction-yellow transition-colors">Projects</Link></li>
              <li><Link to="/documents" className="text-gray-400 hover:text-construction-yellow transition-colors">Documents</Link></li>
              <li><Link to="/risks" className="text-gray-400 hover:text-construction-yellow transition-colors">Risk Management</Link></li>
            </ul>
          </div>
          
          <div>
            <h3 className="mb-4 text-lg font-semibold">Company</h3>
            <ul className="space-y-2">
              <li><Link to="/about" className="text-gray-400 hover:text-construction-yellow transition-colors">About Us</Link></li>
              <li><Link to="/features" className="text-gray-400 hover:text-construction-yellow transition-colors">Features</Link></li>
              <li><Link to="/pricing" className="text-gray-400 hover:text-construction-yellow transition-colors">Pricing</Link></li>
              <li><Link to="/contact" className="text-gray-400 hover:text-construction-yellow transition-colors">Contact</Link></li>
            </ul>
          </div>
          
          <div>
            <h3 className="mb-4 text-lg font-semibold">Legal</h3>
            <ul className="space-y-2">
              <li><Link to="/terms" className="text-gray-400 hover:text-construction-yellow transition-colors">Terms of Service</Link></li>
              <li><Link to="/privacy" className="text-gray-400 hover:text-construction-yellow transition-colors">Privacy Policy</Link></li>
            </ul>
          </div>
        </div>
        
        <div className="pt-8 mt-8 border-t border-gray-800">
          <p className="text-sm text-gray-400">© {new Date().getFullYear()} ConstructBuild. All rights reserved.</p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
