import { motion } from 'motion/react';
import { Button } from './ui/Button';
import { Check, Zap, Crown, Shield } from 'lucide-react';

const plans = [
  {
    name: 'Free',
    price: '$0',
    period: '/month',
    desc: 'Perfect for hobbyists and small projects.',
    icon: Shield,
    features: [
      'Basic AI Plugin Generation',
      'Standard Modpack Builder',
      'Community Support',
      '1 Server Deployment',
      '1GB Storage'
    ],
    buttonText: 'Get Started',
    variant: 'glass' as const,
  },
  {
    name: 'Pro',
    price: '$15',
    period: '/month',
    desc: 'Advanced tools for serious creators.',
    icon: Zap,
    features: [
      'Advanced AI Code Assistant',
      'Unlimited Modpack Builds',
      'Priority Support',
      '3 Server Deployments',
      '10GB Storage',
      'Litematica 3D Builder'
    ],
    buttonText: 'Upgrade to Pro',
    variant: 'primary' as const,
    popular: true,
  },
  {
    name: 'Ultra',
    price: '$45',
    period: '/month',
    desc: 'Enterprise-grade power and resources.',
    icon: Crown,
    features: [
      'Unlimited AI Usage',
      'Custom Plugin Architectures',
      '24/7 Dedicated Support',
      'Unlimited Server Deployments',
      '100GB Storage',
      'Custom Domain Support'
    ],
    buttonText: 'Get Ultra',
    variant: 'glass' as const,
  }
];

export function Pricing() {
  return (
    <section id="pricing" className="py-32 relative">
      <div className="container mx-auto px-6">
        <div className="text-center max-w-3xl mx-auto mb-20">
          <h2 className="text-4xl md:text-5xl font-bold tracking-tight text-white mb-6">Simple, transparent pricing</h2>
          <p className="text-lg text-gray-400">Choose the perfect plan for your Minecraft creation journey.</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-6xl mx-auto">
          {plans.map((plan, i) => (
            <motion.div
              key={plan.name}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.1, duration: 0.5 }}
              className={`glass-panel relative p-8 flex flex-col ${plan.popular ? 'border-blue-500/30 shadow-[0_0_40px_rgba(59,130,246,0.1)]' : ''}`}
            >
              {plan.popular && (
                <div className="absolute -top-4 left-1/2 -translate-x-1/2 px-4 py-1 bg-blue-500 text-white text-xs font-bold rounded-full tracking-wide uppercase">
                  Most Popular
                </div>
              )}
              
              <div className="mb-8">
                <div className="w-12 h-12 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center mb-6">
                  <plan.icon className={`w-6 h-6 ${plan.popular ? 'text-blue-400' : 'text-gray-400'}`} />
                </div>
                <h3 className="text-2xl font-semibold text-white mb-2">{plan.name}</h3>
                <p className="text-gray-400 text-sm h-10">{plan.desc}</p>
              </div>

              <div className="mb-8">
                <div className="flex items-baseline gap-1">
                  <span className="text-5xl font-bold text-white tracking-tight">{plan.price}</span>
                  <span className="text-gray-400">{plan.period}</span>
                </div>
              </div>

              <ul className="space-y-4 mb-8 flex-1">
                {plan.features.map((feature, j) => (
                  <li key={j} className="flex items-start gap-3 text-sm text-gray-300">
                    <Check className="w-5 h-5 text-blue-400 shrink-0" />
                    <span>{feature}</span>
                  </li>
                ))}
              </ul>

              <Button variant={plan.variant} className="w-full" size="lg">
                {plan.buttonText}
              </Button>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
