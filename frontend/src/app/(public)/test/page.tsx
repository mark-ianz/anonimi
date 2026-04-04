"use client"

import { useState } from 'react';

export default function Test() {
  const [isHovered, setIsHovered] = useState(false);

  return (
    <div className='mt-100'>
      <p
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
        style={{ display: 'inline-block', cursor: 'pointer' }}
      >
        Hover Me
      </p>

      {isHovered && (
        <button style={{ marginLeft: '10px' }}>I'll show up</button>
      )}
    </div>
  );
}