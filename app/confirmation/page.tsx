"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { CheckCircle, Mail, Clock, Sparkles, Calendar, X, Plus, Award, CheckCircle2 } from "lucide-react";

interface VerifiedUser {
  id: string;
  phone_number: string;
  name: string;
  email: string;
}

export default function ConfirmationPage() {
  const router = useRouter();
  const [, setVerifiedUser] = useState<VerifiedUser | null>(null);

  const [loyaltyStatus, setLoyaltyStatus] = useState<any>(null);

  useEffect(() => {
    // Load verified user from sessionStorage
    const storedUser = sessionStorage.getItem('verifiedUser');
    if (storedUser) {
      const user = JSON.parse(storedUser);
      setVerifiedUser(user);
      
      // Fetch loyalty status
      fetch(`/api/loyalty/status?phone=${user.phone_number}`)
        .then(res => res.json())
        .then(data => setLoyaltyStatus(data))
        .catch(err => console.error('Failed to fetch loyalty status:', err));
    }
  }, []);

  const handleBookAnotherSlot = () => {
    // User is already verified, go directly to booking
    // The verifiedUser is already in sessionStorage from the previous booking
    router.push('/booking/new');
  };

  const handleExit = () => {
    // Clear all session data and go to home
    sessionStorage.removeItem('verifiedUser');
    sessionStorage.removeItem('lastBookingId');
    router.push('/home');
  };

  const steps = [
    {
      number: 1,
      icon: <Mail className="w-4 h-4" />,
      text: "Check your messages for booking details"
    },
    {
      number: 2,
      icon: <Clock className="w-4 h-4" />,
      text: "Arrive 10 minutes early for your session"
    },
    {
      number: 3,
      icon: <Sparkles className="w-4 h-4" />,
      text: "Bring your music, ideas, and creativity!"
    }
  ];

  return (
    <div className="min-h-screen flex items-center justify-center px-4">
      <div className="max-w-md w-full text-center">
        {/* Success Animation */}
        <div 
          className="mb-8"
        >
          <div 
            className="w-24 h-24 rounded-full bg-gradient-to-br from-green-400 to-emerald-500 flex items-center justify-center mx-auto mb-6 shadow-lg shadow-green-500/30"
          >
            <div
            >
              <CheckCircle className="w-12 h-12 text-white" />
            </div>
          </div>
          
          <h1 
            className="text-3xl md:text-4xl font-bold text-white mb-4"
          >
            Booking Confirmed!
          </h1>
          <p 
            className="text-zinc-400 text-lg"
          >
            Thank you for choosing Resonance Studio. We&apos;ve sent a confirmation to your messages.
          </p>
        </div>

        {/* Info Card */}
        <div 
          className="glass rounded-2xl p-6 mb-8 text-left"
        >
          <h3 className="text-white font-semibold mb-4 flex items-center gap-2">
            <Calendar className="w-5 h-5 text-violet-400" />
            What&apos;s Next?
          </h3>
          <ul 
            className="space-y-3"
          >
            {steps.map((step) => (
              <li 
                key={step.number}
                className="flex items-start gap-3"
              >
                <div 
                  className="w-6 h-6 rounded-full bg-violet-500/20 flex items-center justify-center flex-shrink-0 mt-0.5 text-violet-400"
                >
                  {step.icon}
                </div>
                <p className="text-zinc-400 text-sm">{step.text}</p>
              </li>
            ))}
          </ul>
        </div>

        {/* Actions */}
        <div 
          className="flex flex-col sm:flex-row gap-3"
        >
          <button
            onClick={handleExit}
            className="flex-1 btn-secondary py-4 flex items-center justify-center gap-2"
          >
            <X className="w-5 h-5" />
            Exit
          </button>
          <button
            onClick={handleBookAnotherSlot}
            className="flex-1 btn-accent py-4 flex items-center justify-center gap-2"
          >
            <Plus className="w-5 h-5" />
            Book Another Slot
          </button>
        </div>

        {/* Contact Info */}
        <p 
          className="mt-8 text-zinc-500 text-sm"
        >
          Questions? Contact us at{" "}
          <a href="mailto:resonancestudio12@gmail.com" className="text-violet-400 hover:text-violet-300 transition-colors">
            resonancestudio12@gmail.com
          </a>
        </p>
      </div>
    </div>
  );
}
