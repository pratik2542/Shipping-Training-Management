import jsPDF from 'jspdf';

export const generatePDF = async (data) => {
  const doc = new jsPDF();
  
  // Helper function to add text with proper spacing
  const addText = (text, y) => {
    doc.text(20, y, text);
    return y + 10; // Return next y position
  };

  // Add function to handle signature images
  const addSignature = async (signature, y) => {
    if (signature) {
      try {
        // Calculate dimensions to maintain aspect ratio
        const maxWidth = 100; // Max width for signature
        const imgData = signature;
        
        // Add signature image
        doc.addImage(imgData, 'PNG', 20, y, maxWidth, 30);
        return y + 35; // Return next y position after signature
      } catch (error) {
        console.error('Error adding signature:', error);
        return y + 10;
      }
    }
    return y + 10;
  };

  let y = 20; // Starting y position

  // Basic Information
  doc.setFontSize(16);
  doc.setFont(undefined, 'bold');
  y = addText('Shipping Record Details', y);
  y += 5;

  doc.setFontSize(12);
  doc.setFont(undefined, 'normal');
  
  // ID and Codes
  y = addText(`ID: ${data.id || 'N/A'}`, y);
  y = addText(`Shipment Code: ${data.shipmentCode || 'N/A'}`, y);
  y = addText(`Shipment Date: ${data.shipmentDate || 'N/A'}`, y);

  // Item Details
  y += 5;
  doc.setFont(undefined, 'bold');
  y = addText('Item Details', y);
  doc.setFont(undefined, 'normal');
  y = addText(`Item Number: ${data.itemNo || 'N/A'}`, y);
  y = addText(`Item Name: ${data.itemName || 'N/A'}`, y);
  y = addText(`Lot Number: ${data.lotNumber || 'N/A'}`, y);

  // Quantity Information
  y += 5;
  doc.setFont(undefined, 'bold');
  y = addText('Quantity Information', y);
  doc.setFont(undefined, 'normal');
  y = addText(`Quantities: ${data.quantities || 'N/A'}`, y);
  y = addText(`Remaining Quantity: ${data.remainingQuantity || 'N/A'}`, y);
  y = addText(`Unit: ${data.unit || 'N/A'}`, y);

  // New Fields
  y += 5;
  doc.setFont(undefined, 'bold');
  y = addText('Additional Details', y);
  doc.setFont(undefined, 'normal');
  y = addText(`Qualified Manufacturer: ${data.qualifiedManufacturer || 'N/A'}`, y);
  y = addText(`Vendor: ${data.vendor || 'N/A'}`, y);
  y = addText(`Transportation: ${data.transportation || 'N/A'}`, y);
  y = addText(`Landing Bill Number: ${data.landingBillNumber || 'N/A'}`, y);
  y = addText(`Expiry Date: ${data.expiryDate || 'N/A'}`, y);

  // Damage Information
  if (data.damageToPackaging || data.damageToProduct) {
    y += 5;
    doc.setFont(undefined, 'bold');
    y = addText('Damage Information', y);
    doc.setFont(undefined, 'normal');
    y = addText(`Damage to Packaging: ${data.damageToPackaging ? 'Yes' : 'No'}`, y);
    y = addText(`Damage to Product: ${data.damageToProduct ? 'Yes' : 'No'}`, y);
    if (data.damageNotes) {
      y = addText(`Damage Notes: ${data.damageNotes}`, y);
    }
  }

  // Add new page for signatures if needed
  if (y > 250) {
    doc.addPage();
    y = 20;
  }

  // Signatures Section
  y += 5;
  doc.setFont(undefined, 'bold');
  y = addText('Signatures', y);
  doc.setFont(undefined, 'normal');

  // Receiver
  if (data.receiverName) {
    y = addText('Receiver:', y);
    y = addText(`Name: ${data.receiverName}`, y);
    y = addText(`Date: ${data.receiverDate || 'N/A'}`, y);
    if (data.receiverSign) {
      y = await addSignature(data.receiverSign, y);
    }
    y += 5;
  }

  // Add new page if needed
  if (y > 250) {
    doc.addPage();
    y = 20;
  }

  // Inspector
  if (data.inspectorName) {
    y = addText('Inspector:', y);
    y = addText(`Name: ${data.inspectorName}`, y);
    y = addText(`Date: ${data.inspectorDate || 'N/A'}`, y);
    if (data.inspectorSign) {
      y = await addSignature(data.inspectorSign, y);
    }
    y += 5;
  }

  // Add new page if needed
  if (y > 250) {
    doc.addPage();
    y = 20;
  }

  // Approver
  if (data.approverName) {
    y = addText('Approver:', y);
    y = addText(`Name: ${data.approverName}`, y);
    y = addText(`Date: ${data.approverDate || 'N/A'}`, y);
    if (data.approverSign) {
      y = await addSignature(data.approverSign, y);
    }
  }

  return doc.output('blob');
};