const db = require('../config/database');
const PDFDocument = require('pdfkit');

// Get all reports
async function getReports(req, res) {
  try {
    const result = await db.query('SELECT * FROM reports ORDER BY created_at DESC');
    res.json(result.rows);
  } catch (error) {
    console.error('Error fetching reports:', error);
    res.status(500).json({ error: 'Failed to fetch reports' });
  }
}

// Generate and save a new report
async function createReport(req, res) {
  try {
    const { name, start_date, end_date } = req.body;
    
    if (!name || !start_date || !end_date) {
      return res.status(400).json({ error: 'Name, start_date, and end_date are required' });
    }

    // Calculate metrics
    // Revenue from orders
    const orderRes = await db.query(
      `SELECT COALESCE(SUM(total_amount), 0) as revenue, COUNT(id) as total_orders
       FROM orders 
       WHERE created_at >= $1 AND created_at <= $2 AND status != 'cancelled'`,
      [start_date, end_date]
    );
    const revenue = parseFloat(orderRes.rows[0].revenue);
    const total_orders = parseInt(orderRes.rows[0].total_orders);

    // Cost from order items (joining orders to filter by date)
    const costRes = await db.query(
      `SELECT COALESCE(SUM(oi.cost_at_purchase * oi.quantity), 0) as cost_of_goods
       FROM order_items oi
       JOIN orders o ON o.id = oi.order_id
       WHERE o.created_at >= $1 AND o.created_at <= $2 AND o.status != 'cancelled'`,
      [start_date, end_date]
    );
    const costOfGoods = parseFloat(costRes.rows[0].cost_of_goods);

    // Platform Expenses
    const expenseRes = await db.query(
      `SELECT COALESCE(SUM(amount), 0) as total_expenses
       FROM platform_expenses
       WHERE created_at >= $1 AND created_at <= $2`,
      [start_date, end_date]
    );
    const total_expenses = parseFloat(expenseRes.rows[0].total_expenses);

    // New Users
    const usersRes = await db.query(
      `SELECT COUNT(id) as new_users
       FROM users
       WHERE created_at >= $1 AND created_at <= $2`,
      [start_date, end_date]
    );
    const new_users = parseInt(usersRes.rows[0].new_users);

    const profit = revenue - costOfGoods - total_expenses;

    const reportData = {
      revenue,
      cost_of_goods: costOfGoods,
      total_expenses,
      profit,
      total_orders,
      new_users
    };

    // Save report
    const insertRes = await db.query(
      `INSERT INTO reports (name, start_date, end_date, report_data)
       VALUES ($1, $2, $3, $4) RETURNING *`,
      [name, start_date, end_date, JSON.stringify(reportData)]
    );

    res.status(201).json(insertRes.rows[0]);
  } catch (error) {
    console.error('Error creating report:', error);
    res.status(500).json({ error: 'Failed to create report' });
  }
}

// Delete a report
async function deleteReport(req, res) {
  try {
    const { id } = req.params;
    const result = await db.query('DELETE FROM reports WHERE id = $1 RETURNING *', [id]);
    
    if (result.rowCount === 0) {
      return res.status(404).json({ error: 'Report not found' });
    }
    
    res.json({ message: 'Report deleted successfully' });
  } catch (error) {
    console.error('Error deleting report:', error);
    res.status(500).json({ error: 'Failed to delete report' });
  }
}

// Generate PDF for a report
async function downloadReportPdf(req, res) {
  try {
    const { id } = req.params;
    const result = await db.query('SELECT * FROM reports WHERE id = $1', [id]);
    
    if (result.rowCount === 0) {
      return res.status(404).json({ error: 'Report not found' });
    }
    
    const report = result.rows[0];
    const data = report.report_data;
    
    // Set response headers for PDF download
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="${report.name.replace(/\s+/g, '_')}_${report.start_date.toISOString().split('T')[0]}.pdf"`);
    
    // Create PDF document
    const doc = new PDFDocument({ margin: 50 });
    
    // Pipe PDF to response
    doc.pipe(res);
    
    // Header
    doc.fontSize(24).fillColor('#333333').text('Vasudha Couture', { align: 'center' });
    doc.fontSize(16).fillColor('#666666').text('Monthly Business Report', { align: 'center' });
    doc.moveDown(2);
    
    // Report Info
    doc.fontSize(14).fillColor('#000000').text(`Report Name: ${report.name}`);
    doc.fontSize(12).text(`Period: ${new Date(report.start_date).toLocaleDateString()} to ${new Date(report.end_date).toLocaleDateString()}`);
    doc.text(`Generated On: ${new Date().toLocaleDateString()}`);
    doc.moveDown(2);
    
    // Financial Summary
    doc.fontSize(16).fillColor('#333333').text('Financial Summary', { underline: true });
    doc.moveDown();
    
    doc.fontSize(12).fillColor('#000000');
    doc.text(`Total Revenue: Rs. ${data.revenue.toLocaleString('en-IN')}`);
    doc.text(`Cost of Goods: Rs. ${data.cost_of_goods.toLocaleString('en-IN')}`);
    doc.text(`Platform Expenses: Rs. ${data.total_expenses.toLocaleString('en-IN')}`);
    doc.moveDown();
    
    doc.fontSize(14).fillColor(data.profit >= 0 ? '#10b981' : '#ef4444').text(`Net Profit: Rs. ${data.profit.toLocaleString('en-IN')}`);
    doc.moveDown(2);
    
    // Growth & Activity
    doc.fontSize(16).fillColor('#333333').text('Activity Metrics', { underline: true });
    doc.moveDown();
    
    doc.fontSize(12).fillColor('#000000');
    doc.text(`Total Orders Placed: ${data.total_orders}`);
    doc.text(`New Users Registered: ${data.new_users}`);
    
    // Footer
    doc.moveDown(5);
    doc.fontSize(10).fillColor('#999999').text('This is an auto-generated report by Vasudha Couture System.', { align: 'center' });
    
    // Finalize PDF
    doc.end();

  } catch (error) {
    console.error('Error generating PDF:', error);
    if (!res.headersSent) {
      res.status(500).json({ error: 'Failed to generate PDF' });
    }
  }
}

module.exports = {
  getReports,
  createReport,
  deleteReport,
  downloadReportPdf
};
