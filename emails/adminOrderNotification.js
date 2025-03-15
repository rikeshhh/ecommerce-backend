const generateAdminOrderNotificationEmail = ({
  customerName,
  orderId,
  totalAmount,
  products,
  status,
  paymentStatus,
  createdAt,
}) => {
  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="UTF-8">
      <title>New Order Placed</title>
    </head>
    <body style="font-family: Arial, sans-serif; margin: 0; padding: 0; background-color: #f4f4f4;">
      <div style="max-width: 600px; margin: 20px auto; background-color: #ffffff; border-radius: 8px; box-shadow: 0 2px 5px rgba(0,0,0,0.1);">
        <div style="background-color: #4f46e5; padding: 20px; text-align: center; color: #ffffff;">
          <h1 style="margin: 0; font-size: 24px;">New Order Placed</h1>
        </div>
        <div style="padding: 20px;">
          <p style="font-size: 16px; color: #333333;">A new order has been placed by <strong>${customerName}</strong>.</p>
          <h2 style="font-size: 18px; color: #4f46e5; margin: 20px 0 10px;">Order Details</h2>
          <table style="width: 100%; border-collapse: collapse; font-size: 14px; color: #333333;">
            <tr>
              <td style="padding: 8px; border-bottom: 1px solid #e5e7eb;"><strong>Order ID</strong></td>
              <td style="padding: 8px; border-bottom: 1px solid #e5e7eb;">${orderId}</td>
            </tr>
            <tr>
              <td style="padding: 8px; border-bottom: 1px solid #e5e7eb;"><strong>Total Amount</strong></td>
              <td style="padding: 8px; border-bottom: 1px solid #e5e7eb;">$${totalAmount}</td>
            </tr>
            <tr>
              <td style="padding: 8px; border-bottom: 1px solid #e5e7eb;"><strong>Status</strong></td>
              <td style="padding: 8px; border-bottom: 1px solid #e5e7eb;">${status}</td>
            </tr>
            <tr>
              <td style="padding: 8px; border-bottom: 1px solid #e5e7eb;"><strong>Payment Status</strong></td>
              <td style="padding: 8px; border-bottom: 1px solid #e5e7eb;">${paymentStatus}</td>
            </tr>
            <tr>
              <td style="padding: 8px; border-bottom: 1px solid #e5e7eb;"><strong>Date</strong></td>
              <td style="padding: 8px; border-bottom: 1px solid #e5e7eb;">${createdAt}</td>
            </tr>
          </table>
          <h2 style="font-size: 18px; color: #4f46e5; margin: 20px 0 10px;">Products</h2>
          <table style="width: 100%; border-collapse: collapse; font-size: 14px; color: #333333;">
            <thead>
              <tr style="background-color: #f9fafb;">
                <th style="padding: 8px; text-align: left; border-bottom: 1px solid #e5e7eb;">Name</th>
                <th style="padding: 8px; text-align: left; border-bottom: 1px solid #e5e7eb;">Quantity</th>
                <th style="padding: 8px; text-align: left; border-bottom: 1px solid #e5e7eb;">Price</th>
              </tr>
            </thead>
            <tbody>
              ${products
                .map(
                  (p) => `
                    <tr>
                      <td style="padding: 8px; border-bottom: 1px solid #e5e7eb;">${p.product.name}</td>
                      <td style="padding: 8px; border-bottom: 1px solid #e5e7eb;">${p.quantity}</td>
                      <td style="padding: 8px; border-bottom: 1px solid #e5e7eb;">$${p.product.price}</td>
                    </tr>
                  `
                )
                .join("")}
            </tbody>
          </table>
        </div>
        <div style="background-color: #f9fafb; padding: 15px; text-align: center; font-size: 12px; color: #6b7280;">
          <p style="margin: 0;">Your E-Commerce Platform</p>
        </div>
      </div>
    </body>
    </html>
  `;
};

module.exports = { generateAdminOrderNotificationEmail };
