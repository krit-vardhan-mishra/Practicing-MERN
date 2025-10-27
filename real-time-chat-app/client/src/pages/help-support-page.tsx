import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { ArrowLeft, HelpCircle, MessageCircle, Mail, ExternalLink, Book, Shield, Bug } from "lucide-react";

interface HelpSupportPageProps {
  onClose: () => void;
}

export default function HelpSupportPage({ onClose }: HelpSupportPageProps) {
  const faqs = [
    {
      question: "How do I start a conversation?",
      answer: "Click on a user from the sidebar or use the search to find and start a new conversation."
    },
    {
      question: "How do I make audio/video calls?",
      answer: "In a conversation, click the phone icon for voice calls or camera icon for video calls. Your browser will request microphone/camera permissions."
    },
    {
      question: "Are my messages encrypted?",
      answer: "Yes, all messages are end-to-end encrypted using public-key cryptography. Only you and the recipient can read the messages."
    },
    {
      question: "How do I change my profile settings?",
      answer: "Click the menu button (three dots) in the top-right and select 'Profile' to update your information."
    },
    {
      question: "What should I do if I can't connect to calls?",
      answer: "Ensure your browser has microphone/camera permissions enabled. Try refreshing the page or using a different browser."
    }
  ];

  const supportOptions = [
    {
      icon: MessageCircle,
      title: "Live Chat Support",
      description: "Get instant help from our support team",
      action: "Start Chat",
      available: false
    },
    {
      icon: Mail,
      title: "Email Support",
      description: "Send us an email and we'll respond within 24 hours",
      action: "Send Email",
      available: true,
      href: "mailto:support@chatapp.com"
    },
    {
      icon: Book,
      title: "Documentation",
      description: "Browse our comprehensive user guide",
      action: "View Docs",
      available: true,
      href: "https://docs.chatapp.com"
    },
    {
      icon: Bug,
      title: "Report a Bug",
      description: "Found an issue? Help us improve by reporting it",
      action: "Report Bug",
      available: true,
      href: "https://github.com/krit-vardhan-mishra/Practicing-MERN/issues"
    }
  ];

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <div className="w-full max-w-4xl bg-[#0D1117] border border-[#30363D] rounded-xl shadow-2xl max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="h-[60px] bg-[#161B22] border-b border-[#30363D] flex items-center justify-between px-4 flex-shrink-0">
          <div className="flex items-center gap-3">
            <Button
              variant="ghost"
              size="icon"
              onClick={onClose}
              className="text-gray-400 hover:text-[#C9D1D9] hover:bg-[#30363D]"
            >
              <ArrowLeft className="w-5 h-5" />
            </Button>
            <h2 className="text-lg font-semibold text-[#C9D1D9]">Help & Support</h2>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6 space-y-8 min-h-0">
          {/* Welcome Section */}
          <div className="text-center">
            <HelpCircle className="w-16 h-16 text-[#238636] mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-[#C9D1D9] mb-2">How can we help you?</h3>
            <p className="text-gray-400">Find answers to common questions or get in touch with our support team.</p>
          </div>

          <Separator className="bg-[#30363D]" />

          {/* FAQ Section */}
          <div>
            <h3 className="text-lg font-medium text-[#C9D1D9] mb-4">Frequently Asked Questions</h3>
            <div className="space-y-4">
              {faqs.map((faq, index) => (
                <div key={index} className="bg-[#161B22] border border-[#30363D] rounded-lg p-4">
                  <h4 className="font-medium text-[#C9D1D9] mb-2">{faq.question}</h4>
                  <p className="text-gray-400 text-sm">{faq.answer}</p>
                </div>
              ))}
            </div>
          </div>

          <Separator className="bg-[#30363D]" />

          {/* Support Options */}
          <div>
            <h3 className="text-lg font-medium text-[#C9D1D9] mb-4">Get Support</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {supportOptions.map((option, index) => {
                const Icon = option.icon;
                return (
                  <div key={index} className="bg-[#161B22] border border-[#30363D] rounded-lg p-4">
                    <div className="flex items-start gap-3">
                      <Icon className="w-6 h-6 text-[#238636] mt-1" />
                      <div className="flex-1">
                        <h4 className="font-medium text-[#C9D1D9] mb-1">{option.title}</h4>
                        <p className="text-gray-400 text-sm mb-3">{option.description}</p>
                        {option.available ? (
                          <Button
                            size="sm"
                            className="bg-[#238636] hover:bg-[#238636]/90"
                            onClick={() => {
                              if (option.href) {
                                window.open(option.href, '_blank');
                              }
                            }}
                          >
                            {option.action}
                            {option.href && <ExternalLink className="w-3 h-3 ml-1" />}
                          </Button>
                        ) : (
                          <Button size="sm" disabled className="bg-gray-600">
                            Coming Soon
                          </Button>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          <Separator className="bg-[#30363D]" />

          {/* Additional Resources */}
          <div>
            <h3 className="text-lg font-medium text-[#C9D1D9] mb-4">Additional Resources</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="bg-[#161B22] border border-[#30363D] rounded-lg p-4">
                <Shield className="w-8 h-8 text-[#238636] mb-2" />
                <h4 className="font-medium text-[#C9D1D9] mb-1">Privacy & Security</h4>
                <p className="text-gray-400 text-sm mb-3">
                  Learn about our commitment to your privacy and how we protect your data.
                </p>
                <Button
                  size="sm"
                  variant="outline"
                  className="border-[#30363D] text-[#30363D] hover:bg-[#30363D] hover:text-[#C9D1D9]"
                  onClick={() => window.open('https://docs.chatapp.com/privacy', '_blank')}
                >
                  Learn More
                </Button>
              </div>

              <div className="bg-[#161B22] border border-[#30363D] rounded-lg p-4">
                <Book className="w-8 h-8 text-[#238636] mb-2" />
                <h4 className="font-medium text-[#C9D1D9] mb-1">Best Practices</h4>
                <p className="text-gray-400 text-sm mb-3">
                  Tips and best practices for getting the most out of your chat experience.
                </p>
                <Button
                  size="sm"
                  variant="outline"
                  className="border-[#30363D] text-[#30363D] hover:bg-[#30363D] hover:text-[#C9D1D9]"
                  onClick={() => window.open('https://docs.chatapp.com/best-practices', '_blank')}
                >
                  View Guide
                </Button>
              </div>
            </div>
          </div>

          {/* Contact Info */}
          <div className="bg-[#161B22] border border-[#30363D] rounded-lg p-4">
            <h3 className="text-lg font-medium text-[#C9D1D9] mb-2">Still need help?</h3>
            <p className="text-gray-400 text-sm mb-4">
              Can't find what you're looking for? Our support team is here to help.
            </p>
            <div className="flex flex-col sm:flex-row gap-3">
              <Button
                className="bg-[#238636] hover:bg-[#238636]/90"
                onClick={() => window.open('mailto:support@chatapp.com', '_blank')}
              >
                <Mail className="w-4 h-4 mr-2" />
                Contact Support
              </Button>
              <Button
                variant="outline"
                className="border-[#30363D] text-[#30363D] hover:bg-[#30363D] hover:text-[#C9D1D9]"
                onClick={() => window.open('https://github.com/krit-vardhan-mishra/Practicing-MERN/issues', '_blank')}
              >
                <Bug className="w-4 h-4 mr-2" />
                Report Issue
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}