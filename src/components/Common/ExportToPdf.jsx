import React from "react";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import { useTranslation } from "react-i18next";
import { DropdownItem } from "reactstrap";
import { FaFilePdf } from "react-icons/fa6";

const ExportToPDF = ({ tableData, tablename, includeKey = [], dropdownItem = false }) => {
  const { t } = useTranslation();
  const headerText = tablename; // Custom header text
  const footerText = "Prepared by: ____"; // Custom footer text

  // Function to add header and footer
  const addHeaderFooter = (doc) => {
    const pageCount = doc.internal.getNumberOfPages();

    for (let i = 1; i <= pageCount; i++) {
      doc.setPage(i);

      // Add header
      doc.setFontSize(12);
      doc.text(headerText, 14, 10);

      // Add footer
      const pageSize = doc.internal.pageSize;
      const pageHeight = pageSize.height ? pageSize.height : pageSize.getHeight();
      doc.setFontSize(10);
      doc.text(footerText, 14, pageHeight - 10);
    }
  };
  const handleExportToPDF = () => {
    if (!tableData || tableData.length === 0) {
      return;
    }

    const filteredKeys = Object.keys(tableData[0]).filter(
      (key) => includeKey.includes(key)
    );

    const chunkSize = 7;
    const columnChunks = [];
    for (let i = 0; i < filteredKeys.length; i += chunkSize) {
      columnChunks.push(filteredKeys.slice(i, i + chunkSize));
    }

    const doc = new jsPDF({
      orientation: "landscape",
    });

    //const title = tablename || "Table Data";
    //doc.text(title, 14, 10);

    let startY = 20;

    columnChunks.forEach((columns, index) => {
      if (index > 0) {
        startY += 80;
        if (startY + 50 > doc.internal.pageSize.height) {
          doc.addPage();
          startY = 20;
        }
      }

      const headers = ["Index", ...columns.map((key) => t(key))];

      const dataRows = tableData.map((row, rowIndex) => [
        rowIndex + 1,
        ...columns.map((key) => row[key] || ""),
      ]);

      autoTable(doc, {
        head: [headers],
        body: dataRows,
        startY,
        styles: { fontSize: 8 },
        headStyles: { fillColor: [22, 160, 133] },
        theme: "grid",
        showHead: "everyPage",
      });

      startY = doc.lastAutoTable.finalY + 10;
    });
    addHeaderFooter(doc);
    doc.save(`${tablename || "table_data"}.pdf`);
  };

  if (dropdownItem) {
    return (
      <DropdownItem onClick={handleExportToPDF} disabled={!tableData || tableData.length === 0}>
        <FaFilePdf className="me-1" />
        {t("exportToPdf")}
      </DropdownItem>
    );
  }

  return (
    <button
      className="btn btn-soft-primary"
      disabled={!tableData || tableData.length === 0}
      onClick={handleExportToPDF}
    >
      {t("exportToPdf")}
    </button>
  );
};

export default ExportToPDF;
