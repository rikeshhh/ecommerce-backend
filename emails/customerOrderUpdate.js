const generateCustomerOrderUpdateEmail = ({
  customerName,
  orderId,
  newStatus,
  updatedAt,
  orderUrl,
}) => {
  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Order Status Updated</title>
    </head>
    <body style="font-family: Arial, sans-serif; margin: 0; padding: 0; background-color: #f4f4f4;">
      <div style="max-width: 600px; margin: 20px auto; background-color: #ffffff; border-radius: 8px; box-shadow: 0 2px 5px rgba(0,0,0,0.1);">
        <!-- Header -->
        <div style="background-color: #4f46e5; padding: 20px; text-align: center; color: #ffffff;">
          <h1 style="margin: 0; font-size: 24px;">Order Update</h1>
        </div>
        <!-- Content -->
        <div style="padding: 20px;">
          <p style="font-size: 16px; color: #333333; margin: 0 0 15px;">
            Dear ${customerName},
          </p>
          <p style="font-size: 16px; color: #333333; margin: 0 0 15px;">
            Your order (ID: ${orderId}) has been updated:
          </p>
          <p style="font-size: 16px; color: #333333; margin: 0 0 10px;">
            <strong>New Status:</strong> ${newStatus}
          </p>
          <p style="font-size: 14px; color: #666666; margin: 0 0 15px;">
            Updated on: ${updatedAt}
          </p>
          <a href="${orderUrl}" style="display: inline-block; padding: 10px 20px; background-color: #4f46e5; color: #ffffff; text-decoration: none; border-radius: 5px;">
            View Order
          </a>
        </div>
        <!-- Footer -->
        <div style="background-color: #f9fafb; padding: 15px; text-align: center; font-size: 12px; color: #6b7280;">
          <p style="margin: 0;">Your E-Commerce Platform</p>
        </div>
      </div>
    </body>
    </html>
  `;
};

module.exports = { generateCustomerOrderUpdateEmail };
