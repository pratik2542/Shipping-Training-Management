import React from 'react';
import ManufacturingFormBase from './ManufacturingFormBase';

const components = [
  { 
    name: 'Vitamin D3',
    fields: ['lotNumber', 'itemNumber', 'expDate', 'releaseDate', 'quantity']
  },
  {
    name: 'Medium Chain Triglycerides',
    fields: ['lotNumber', 'itemNumber', 'expDate', 'releaseDate', 'quantity']
  },
  {
    name: 'Tocopherol',
    fields: ['lotNumber', 'itemNumber', 'expDate', 'releaseDate', 'quantity']
  },
  {
    name: 'Sunflower Oil',
    fields: ['lotNumber', 'itemNumber', 'expDate', 'releaseDate', 'quantity']
  },
  {
    name: 'Mixed Tocopherols',
    fields: ['lotNumber', 'itemNumber', 'expDate', 'releaseDate', 'quantity']
  }
];

const VitaminDForm = () => (
  <ManufacturingFormBase
    formTitle="Vitamin D Manufacturing Form"
    components={components}
    collectionName="manufacturing_vitamin_d"
  />
);

export default VitaminDForm;
