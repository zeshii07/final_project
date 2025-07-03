 
// src/components/StripePaymentForm.js
import React, { useState, useEffect } from 'react';
import { PaymentElement, useStripe, useElements } from '@stripe/react-stripe-js';
import 'bootstrap/dist/css/bootstrap.min.css';

// This component is designed to be rendered INSIDE the <Elements> provider
// It takes clientSecret and a handlePaymentSuccess prop
function StripePaymentForm({ clientSecret, onPaymentConfirmed, setStripeError, loadingInitialPaymentIntent }) {
    const stripe = useStripe();
    const elements = useElements();
    const [isLoading, setIsLoading] = useState(false); // Local loading state for payment processing

    const paymentElementOptions = {
        layout: 'tabs',
    };

    // This effect ensures errors are cleared when clientSecret changes
    useEffect(() => {
        if (clientSecret) {
            setStripeError(null); // Clear parent error when new client secret arrives
        }
    }, [clientSecret, setStripeError]);


    // Function to be called by the parent (Checkout.js) when "Place Order" is clicked
    const confirmStripePayment = async () => {
        if (!stripe || !elements) {
            setStripeError('Stripe.js has not loaded or initialized correctly. Please refresh the page.');
            return { success: false };
        }

        setIsLoading(true); // Start loading for payment confirmation

        const { error: stripeError, paymentIntent } = await stripe.confirmPayment({
            elements,
            confirmParams: {
                return_url: `${window.location.origin}/checkout`,
            },
            redirect: 'if_required',
        });

        setIsLoading(false); // End loading

        if (stripeError) {
            console.error('Stripe error during confirmation:', stripeError);
            setStripeError(stripeError.message);
            return { success: false, message: stripeError.message };
        }

        if (paymentIntent.status === 'succeeded') {
            onPaymentConfirmed(paymentIntent.id); // Call parent callback with paymentIntent ID
            return { success: true, paymentIntentId: paymentIntent.id };
        } else {
            console.warn('Payment Intent status after confirmation:', paymentIntent.status);
            setStripeError(`Payment did not succeed: ${paymentIntent.status}. ${paymentIntent.last_payment_error?.message || ''}`);
            return { success: false, message: `Payment not succeeded: ${paymentIntent.status}` };
        }
    };

    // Pass the confirmation function to the parent via prop, so parent can call it
    useEffect(() => {
        if (onPaymentConfirmed) { // This `onPaymentConfirmed` is actually `setConfirmStripePaymentFn` in parent
            onPaymentConfirmed(confirmStripePayment);
        }
    }, [confirmStripePayment, onPaymentConfirmed]);


    if (loadingInitialPaymentIntent) {
        return (
            <div className="d-flex justify-content-center align-items-center py-4">
                <div className="spinner-border text-app-accent" role="status">
                    <span className="visually-hidden">Loading payment form...</span>
                </div>
                <p className="ms-3 text-muted">Initializing secure payment details...</p>
            </div>
        );
    }

    // Only render PaymentElement if Stripe and Elements are ready AND clientSecret is present
    if (!stripe || !elements || !clientSecret) {
        return (
            <div className="d-flex justify-content-center align-items-center py-4">
                <p className="ms-3 text-danger">Payment form could not be loaded. Please try again or check connection.</p>
            </div>
        );
    }

    return (
        <div className="stripe-payment-form">
            <PaymentElement id="payment-element" options={paymentElementOptions} />
            {isLoading && (
                <div className="d-flex justify-content-center align-items-center mt-3">
                    <div className="spinner-border text-app-accent spinner-border-sm" role="status">
                        <span className="visually-hidden">Processing payment...</span>
                    </div>
                    <span className="ms-2 text-muted">Processing payment...</span>
                </div>
            )}
        </div>
    );
}

export default StripePaymentForm;