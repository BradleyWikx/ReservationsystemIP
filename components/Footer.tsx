import React from 'react';

const Footer: React.FC = () => {
  return (
    <footer>
      <p>&copy; {new Date().getFullYear()} Inspiration Point</p>
      {/* Add other footer elements here */}
    </footer>
  );
};

export default Footer;