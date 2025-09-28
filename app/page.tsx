"use client";
import Link from 'next/link';
import { useAuthStore } from '../lib/authStore';

export default function HomePage() {
  const user = useAuthStore(state=>state.user);
  return (
    <main className="space-y-16 overflow-hidden">
      {/* Hero Section */}
      <section className="relative text-center pt-16 pb-12">
        {/* Animated Background */}
        <div className="absolute inset-0 -z-10">
          <div className="absolute top-1/4 left-1/4 w-72 h-72 bg-indigo-500/10 rounded-full blur-3xl animate-pulse"></div>
          <div className="absolute top-1/2 right-1/4 w-96 h-96 bg-cyan-500/10 rounded-full blur-3xl animate-pulse" style={{animationDelay: '1s'}}></div>
          <div className="absolute bottom-1/4 left-1/3 w-64 h-64 bg-purple-500/10 rounded-full blur-3xl animate-pulse" style={{animationDelay: '2s'}}></div>
        </div>
        
        <div className="animate-fade-in-up">
          <h1 className="text-6xl md:text-7xl font-extrabold bg-gradient-to-r from-indigo-400 via-purple-400 to-cyan-300 text-transparent bg-clip-text tracking-tight mb-6 animate-gradient">
            Play. Win. Withdraw.
          </h1>
          <p className="mt-6 text-xl text-slate-300 max-w-3xl mx-auto leading-relaxed">
            Experience the thrill of mini-games where every bet counts. 
            <span className="text-cyan-300 font-semibold"> Instant gameplay</span>, 
            <span className="text-indigo-300 font-semibold"> secure withdrawals</span>, and 
            <span className="text-purple-300 font-semibold"> provably fair</span> gaming.
          </p>
          
          <div className="mt-10 flex flex-col sm:flex-row justify-center gap-4 max-w-md mx-auto">
            {!user && (
              <>
                <Link 
                  href="/auth/register" 
                  className="group relative px-8 py-4 bg-gradient-to-r from-indigo-600 to-cyan-600 rounded-full font-semibold text-lg transition-all duration-300 hover:scale-105 hover:shadow-2xl hover:shadow-indigo-500/25 overflow-hidden"
                >
                  <span className="relative z-10">Get Started Free</span>
                  <div className="absolute inset-0 bg-gradient-to-r from-indigo-500 to-cyan-500 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                </Link>
                <Link 
                  href="/auth/login" 
                  className="px-8 py-4 border-2 border-slate-600 hover:border-slate-400 rounded-full font-semibold text-lg transition-all duration-300 hover:scale-105 hover:bg-slate-800/50"
                >
                  Login
                </Link>
              </>
            )}
            {user && (
              <Link 
                href="/dashboard" 
                className="group relative px-8 py-4 bg-gradient-to-r from-indigo-600 to-cyan-600 rounded-full font-semibold text-lg transition-all duration-300 hover:scale-105 hover:shadow-2xl hover:shadow-indigo-500/25 overflow-hidden"
              >
                <span className="relative z-10">Go to Dashboard</span>
                <div className="absolute inset-0 bg-gradient-to-r from-indigo-500 to-cyan-500 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
              </Link>
            )}
          </div>
        </div>
      </section>
      {/* Features Section */}
      <section className="px-4">
        <div className="text-center mb-12">
          <h2 className="text-4xl font-bold bg-gradient-to-r from-slate-200 to-slate-400 text-transparent bg-clip-text mb-4">
            Why Choose The2Win?
          </h2>
          <p className="text-slate-400 max-w-2xl mx-auto">
            Built with cutting-edge technology for the ultimate gaming experience
          </p>
        </div>
        
        <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3 max-w-6xl mx-auto">
          {[
            { 
              title: 'Instant Bets', 
              desc: 'Low-latency gameplay with real-time balance updates and lightning-fast transactions.',
              icon: '⚡',
              gradient: 'from-yellow-400 to-orange-500'
            },
            { 
              title: 'Multiple Funding', 
              desc: 'Support for cards, bank transfers, and crypto wallets for maximum convenience.',
              icon: '💳',
              gradient: 'from-green-400 to-emerald-500'
            },
            { 
              title: 'Secure Withdrawals', 
              desc: 'Advanced KYC verification and anti-fraud protection for your peace of mind.',
              icon: '🔒',
              gradient: 'from-blue-400 to-cyan-500'
            },
            { 
              title: 'Provably Fair', 
              desc: 'Transparent algorithms with verifiable randomness you can trust.',
              icon: '🎯',
              gradient: 'from-purple-400 to-pink-500'
            },
            { 
              title: 'Mobile First', 
              desc: 'Responsive design optimized for seamless gaming on any device.',
              icon: '📱',
              gradient: 'from-indigo-400 to-purple-500'
            },
            { 
              title: 'Scalable Tech', 
              desc: 'Enterprise-grade infrastructure built to handle millions of bets.',
              icon: '🚀',
              gradient: 'from-red-400 to-pink-500'
            },
          ].map((feature, index) => (
            <div 
              key={feature.title}
              className="group relative rounded-2xl bg-gradient-to-br from-slate-800/80 to-slate-900/80 p-8 border border-slate-700 hover:border-slate-500 transition-all duration-500 hover:scale-105 hover:shadow-2xl backdrop-blur-sm"
              style={{
                animationDelay: `${index * 0.1}s`
              }}
            >
              <div className={`absolute inset-0 bg-gradient-to-br ${feature.gradient} opacity-0 group-hover:opacity-10 rounded-2xl transition-opacity duration-500`}></div>
              
              <div className="relative z-10">
                <div className="text-4xl mb-4 transform group-hover:scale-110 transition-transform duration-300">
                  {feature.icon}
                </div>
                <h3 className="text-xl font-bold mb-3 text-white group-hover:text-transparent group-hover:bg-clip-text group-hover:bg-gradient-to-r group-hover:from-white group-hover:to-slate-300 transition-all duration-300">
                  {feature.title}
                </h3>
                <p className="text-slate-300 leading-relaxed group-hover:text-slate-200 transition-colors duration-300">
                  {feature.desc}
                </p>
              </div>
            </div>
          ))}
        </div>
      </section>
      {/* CTA Section */}
      <section className="relative text-center py-20 px-4">
        <div className="absolute inset-0 bg-gradient-to-r from-indigo-900/20 via-purple-900/20 to-cyan-900/20 rounded-3xl blur-3xl"></div>
        
        <div className="relative z-10 max-w-4xl mx-auto">
          <h3 className="text-5xl font-bold mb-6 bg-gradient-to-r from-indigo-300 via-purple-300 to-cyan-300 text-transparent bg-clip-text">
            Ready to roll the dice?
          </h3>
          <p className="text-xl text-slate-300 mb-8 max-w-2xl mx-auto">
            Join thousands of players already winning big on The2Win platform
          </p>
          
          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
            <Link 
              href={user ? '/games' : '/auth/register'} 
              className="group relative px-10 py-5 bg-gradient-to-r from-cyan-600 to-blue-600 rounded-full font-bold text-xl transition-all duration-300 hover:scale-110 hover:shadow-2xl hover:shadow-cyan-500/25 overflow-hidden"
            >
              <span className="relative z-10">
                {user ? '🎮 Play Games Now' : '🎉 Start Playing Now'}
              </span>
              <div className="absolute inset-0 bg-gradient-to-r from-cyan-500 to-blue-500 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
            </Link>
            
            {!user && (
              <div className="flex items-center gap-2 text-slate-400">
                <span>Already have an account?</span>
                <Link 
                  href="/auth/login" 
                  className="text-cyan-400 hover:text-cyan-300 font-semibold underline-offset-4 hover:underline transition-all duration-200"
                >
                  Sign in
                </Link>
              </div>
            )}
          </div>
          
          {/* Stats */}
          <div className="mt-16 grid grid-cols-1 md:grid-cols-3 gap-8 max-w-3xl mx-auto">
            {[
              { label: 'Active Players', value: '10,000+' },
              { label: 'Games Played', value: '1M+' },
              { label: 'Total Winnings', value: '$2M+' }
            ].map((stat, index) => (
              <div key={stat.label} className="text-center" style={{animationDelay: `${index * 0.2}s`}}>
                <div className="text-3xl font-bold text-white mb-2">{stat.value}</div>
                <div className="text-slate-400">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>
    </main>
  );
}
