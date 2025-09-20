// Test file to check InterviewSetup component functionality
import React from 'react';
import { render } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import InterviewSetup from '../pages/InterviewSetup';

// Simple test to check if component renders without errors
test('InterviewSetup component renders', () => {
  const { getByText } = render(
    <MemoryRouter>
      <InterviewSetup />
    </MemoryRouter>
  );
  
  // Check if the main heading is present
  expect(getByText('Set Up Your Interview')).toBeInTheDocument();
  
  // Check if step 1 (Job Role) is visible by default
  expect(getByText('Select Your Job Role')).toBeInTheDocument();
});

console.log('Test file created successfully');