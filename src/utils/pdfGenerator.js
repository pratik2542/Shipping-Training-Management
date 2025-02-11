import jsPDF from 'jspdf';

export const generatePDF = async (data) => {
  try {
    const doc = new jsPDF();
    
    // Add header
    doc.setFontSize(20);
    doc.text("Shipping Form", 105, 15, { align: "center" });
    
    // Add form data
    doc.setFontSize(12);
    let y = 30;
    
    // Add all form fields
    const fields = [
      ['DP Number', data.dpNumber],
      ['ID', data.id],
      ['Shipment Date', data.shipmentDate],
      ['Item No', data.itemNo],
      ['Item Name', data.itemName],
      ['Lot Number', data.lotNumber],
      ['Quantities', data.quantities],
    ];

    fields.forEach(([label, value]) => {
      doc.text(`${label}: ${value || ''}`, 20, y);
      y += 10;
    });
    
    // Add sections with proper spacing
    const addSection = (title, name, date, signature, yPos) => {
      doc.setFontSize(14);
      doc.text(title, 20, yPos);
      doc.setFontSize(12);
      doc.text(`Name: ${name || ''}`, 20, yPos + 10);
      doc.text(`Date: ${date || ''}`, 20, yPos + 20);
      if (signature) {
        doc.addImage(signature, 'PNG', 20, yPos + 25, 50, 25);
      }
      return yPos + 60;
    };

    // Add each section
    y = addSection('Receiver Details', data.receiverName, data.receiverDate, data.receiverSign, y + 10);
    y = addSection('Inspector Details', data.inspectorName, data.inspectorDate, data.inspectorSign, y);
    y = addSection('Approver Details', data.approverName, data.approverDate, data.approverSign, y);

    return doc.output('arraybuffer');
  } catch (error) {
    console.error('Error generating PDF:', error);
    throw new Error('Failed to generate PDF');
  }
}; 