import { ArrowLeft } from "lucide-react";

export default function PrivacyPolicy() {
  return (
    <div className="min-h-screen bg-sage-50 text-stone-800 p-6 md:p-12 max-w-2xl mx-auto">
      <button 
        onClick={() => window.location.pathname = '/'}
        className="flex items-center gap-2 text-stone-500 hover:text-stone-800 transition-colors mb-8"
      >
        <ArrowLeft size={16} />
        <span className="text-sm font-medium">Back to app</span>
      </button>

      <h1 className="text-3xl font-bold mb-6 tracking-tight">Privacy Policy</h1>
      
      <div className="space-y-6 text-stone-600 leading-relaxed text-sm">
        <section>
          <h2 className="text-lg font-semibold text-stone-800 mb-2">1. Introduction</h2>
          <p>
            Welcome to Flow. We respect your privacy and are committed to protecting your personal data. 
            This privacy policy will inform you as to how we look after your data when you visit our application 
            and tell you about your privacy rights.
          </p>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-stone-800 mb-2">2. Data We Collect</h2>
          <p>
            Flow is designed as a client-side only application. We do not operate any external servers or databases 
            to store your personal information. When you connect your Google Account:
          </p>
          <ul className="list-disc pl-5 mt-2 space-y-1">
            <li>We request read-only access to your Gmail to parse transaction alerts.</li>
            <li>All parsing and processing happens locally on your device within your browser.</li>
            <li>No email contents, transaction data, or personal information is ever transmitted to or stored on any server controlled by us.</li>
          </ul>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-stone-800 mb-2">3. How We Use Your Data</h2>
          <p>
            The data accessed via the Google API is strictly used to provide the core functionality of the Flow application:
          </p>
          <ul className="list-disc pl-5 mt-2 space-y-1">
            <li>To identify and categorize your financial transactions automatically.</li>
            <li>To display your spending insights and remaining budget on your dashboard.</li>
          </ul>
          <p className="mt-2 font-medium text-stone-800">
            We do not use your data for advertising, nor do we share or sell it to any third parties.
          </p>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-stone-800 mb-2">4. Data Security & Storage</h2>
          <p>
            All your processed expense data is stored securely in your browser's local storage. Because we do not store your data on our servers, 
            we are inherently protected from data breaches affecting our infrastructure.
          </p>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-stone-800 mb-2">5. Your Rights</h2>
          <p>
            You have complete control over your data. You can disconnect Flow from your Google Account at any time 
            via your Google Account Security settings. You can also wipe all local data by signing out of the Flow app 
            or clearing your browser cache.
          </p>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-stone-800 mb-2">6. Contact Us</h2>
          <p>
            If you have any questions about this privacy policy or our privacy practices, please contact us at: 
            avineeshgujjeti2006@gmail.com
          </p>
        </section>
      </div>

      <p className="text-xs text-stone-400 mt-12 pt-6 border-t border-stone-200">
        Last updated: August 2026
      </p>
    </div>
  );
}
