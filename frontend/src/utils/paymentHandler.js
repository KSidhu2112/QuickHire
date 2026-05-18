import { paymentAPI } from '../services/api';
import { loadScript } from './loadScript';

/**
 * Handle Razorpay payment flow for monetization.
 * @param {Object} options - action: 'apply' | 'post_job', jobId?: string, amount?: number
 * @param {Function} onSuccess - Callback for successful payment
 * @param {Function} onError - Callback for failed payment/error
 */
export const startMonetizationPayment = async (options, onSuccess, onError) => {
    try {
        const { action, jobId, amount } = options;

        // 1. Create order
        const orderData = await paymentAPI.createOrder({ action, jobId, amount });

        if (!orderData.success) {
            throw new Error(orderData.message || 'Failed to create order');
        }

        const { order, key } = orderData;

        // 2. Open Razorpay checkout
        const razorpayOptions = {
            key: key,
            amount: order.amount,
            currency: "INR",
            name: "QuickHire",
            description: action === 'apply' ? "Job Application Fee" : "Job Posting Fee",
            order_id: order.id,
            handler: async (response) => {
                try {
                    // 3. Verify payment 
                    const verification = await paymentAPI.verifyPayment({
                        razorpay_order_id: response.razorpay_order_id,
                        razorpay_payment_id: response.razorpay_payment_id,
                        razorpay_signature: response.razorpay_signature
                    });

                    if (verification.success) {
                        onSuccess(verification);
                    } else {
                        onError(new Error("Verification failed"));
                    }
                } catch (err) {
                    onError(err);
                }
            },
            prefill: {
                name: JSON.parse(localStorage.getItem('quickhire_user'))?.name || "",
                email: JSON.parse(localStorage.getItem('quickhire_user'))?.email || ""
            },
            theme: {
                color: "#1d4ed8"
            },
            config: {
                display: {
                    blocks: {
                        upi: {
                            name: "Pay via UPI (PhonePe, Paytm, GPay)",
                            instruments: [{ method: "upi" }]
                        },
                        wallets: {
                            name: "Digital Wallets",
                            instruments: [{ method: "wallet" }]
                        }
                    },
                    sequence: ["block.upi", "block.wallets"],
                    preferences: {
                        show_default_blocks: true
                    }
                }
            }
        };

        const res = await loadScript('https://checkout.razorpay.com/v1/checkout.js');

        if (!res) {
            onError(new Error("Razorpay SDK failed to load"));
            return;
        }

        const rzp = new window.Razorpay(razorpayOptions);
        rzp.on('payment.failed', function (response) {
            onError(new Error(response.error.description || "Payment failed"));
        });
        rzp.open();
    } catch (error) {
        console.error("Payment initiation error:", error);
        onError(error);
    }
};
