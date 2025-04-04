import React, { useEffect, useState } from 'react';
import axios from 'axios';
import BackToHomeButton from './BackToHomeButton';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';

const AgingReportPage = ({ entityId }) => {
  const [report, setReport] = useState(null);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState(['APPROVED', 'DRAFT']);

  const statusOptions = ['APPROVED', 'DRAFT', 'NEW', 'PAID', 'CANCELLED'];

  const loadReport = async () => {
    setLoading(true);
    try {
      const res = await axios.post('http://localhost:8000/api/aging-report/', {
        entity_id: entityId,
        statuses: statusFilter,
      });
      if (res.data.status === 'success') {
        setReport(res.data.aging);
      }
    } catch (err) {
      console.error('❌ Aging Report Error:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (entityId) {
      loadReport();
    }
  }, [entityId, statusFilter]);

  const handleStatusChange = (e) => {
    const value = e.target.value;
    setStatusFilter((prev) =>
      prev.includes(value) ? prev.filter((s) => s !== value) : [...prev, value]
    );
  };

  const exportPDF = async () => {
    const input = document.getElementById('reportContainer');
    const canvas = await html2canvas(input, {
      scale: 3,
      useCORS: true,
      allowTaint: true,
    });
    const imgData = canvas.toDataURL('image/png', 1.0);
    const pdf = new jsPDF('p', 'mm', 'a4');
    
    const pdfWidth = pdf.internal.pageSize.getWidth();
    const margin = 15;
    const availableWidth = pdfWidth - margin * 2;
    
    // Add header title in black
    pdf.setFontSize(22);
    pdf.setTextColor(0); // black color
    pdf.text("AP Aging Report", pdfWidth / 2, 20, { align: "center" });
    
    // Calculate image dimensions in PDF
    const imgProps = pdf.getImageProperties(imgData);
    const pdfHeight = (imgProps.height * availableWidth) / imgProps.width;
    
    pdf.addImage(imgData, 'PNG', margin, 30, availableWidth, pdfHeight);
    
    // Add footer with generation date
    pdf.setFontSize(10);
    pdf.setTextColor(150);
    pdf.text(
      "Generated on " + new Date().toLocaleString(),
      pdfWidth / 2,
      pdf.internal.pageSize.getHeight() - 10,
      { align: "center" }
    );
    
    pdf.save('aging_report.pdf');
  };
  
  

  return (
    <div className="max-w-5xl mx-auto py-10 px-6">
      <BackToHomeButton />
      <h1 className="text-3xl font-bold text-indigo-800 mb-8">AP Aging Report</h1>

      <div className="mb-8">
        <h3 className="text-lg font-semibold mb-3">Filter by Status:</h3>
        <div className="flex flex-wrap gap-4">
          {statusOptions.map((status) => (
            <label key={status} className="flex items-center gap-2 text-sm cursor-pointer">
              <input
                type="checkbox"
                checked={statusFilter.includes(status)}
                onChange={handleStatusChange}
                value={status}
                className="h-4 w-4 text-indigo-600 border-gray-300 rounded focus:ring-indigo-500"
              />
              {status}
            </label>
          ))}
        </div>
      </div>

      {/* Export PDF Button */}
      <div className="mb-6">
        <button
          onClick={exportPDF}
          className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-md transition"
        >
          Export PDF
        </button>
      </div>

      {loading ? (
        <p className="text-gray-600 text-center py-8">Loading report...</p>
      ) : report ? (
        <div id="reportContainer" className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {Object.entries(report).map(([bucket, invoices]) => (
            <div key={bucket} className="bg-white shadow rounded-xl p-6 transition hover:shadow-lg">
              <h2 className="text-lg font-semibold text-indigo-700 mb-4">{bucket}</h2>
              {invoices.length === 0 ? (
                <p className="text-gray-500 text-sm">No invoices</p>
              ) : (
                <table className="min-w-full text-sm">
                  <thead>
                    <tr className="border-b border-gray-200 text-gray-600">
                      <th className="py-2 pl-2 pr-4 text-left">Vendor</th>
                      <th className="py-2 px-4 text-left">Amount</th>
                      <th className="py-2 px-4 text-left">Due</th>
                      <th className="py-2 pr-2 text-left">Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {invoices.map((inv) => (
                      <tr key={inv.id} className="border-b last:border-0">
                        <td className="py-2 pl-2 pr-4">{inv.vendor?.name || '—'}</td>
                        <td className="py-2 px-4">
                          {inv.currency} ${inv.amount?.toFixed(2)}
                        </td>
                        <td className="py-2 px-4">
                          {inv.dueDate ? new Date(inv.dueDate).toLocaleDateString() : '—'}
                        </td>
                        <td className="py-2 pr-2 capitalize">{inv.status}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          ))}
        </div>
      ) : (
        <p className="text-red-500 text-center">Failed to load aging report.</p>
      )}
    </div>
  );
};

export default AgingReportPage;
