import { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { Button } from '../components/ui/Button';
import { Search, Download, ExternalLink, Package, Loader2, ArrowLeft, Filter, Globe } from 'lucide-react';
import { Link } from 'react-router-dom';

export function AddonBrowser() {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [platform, setPlatform] = useState<'modrinth' | 'curseforge'>('modrinth');
  const [type, setType] = useState<'mod' | 'plugin'>('mod');

  // Load initial popular mods
  useEffect(() => {
    searchAddons('optimization');
  }, []);

  const searchAddons = async (searchQuery = query) => {
    if (!searchQuery) return;
    setLoading(true);
    try {
      if (platform === 'modrinth') {
        const facets = type === 'mod' ? '[["project_type:mod"]]' : '[["project_type:plugin"]]';
        const res = await fetch(`https://api.modrinth.com/v2/search?query=${searchQuery}&facets=${facets}&limit=20`);
        const data = await res.json();
        setResults(data.hits || []);
      } else {
        // CurseForge mock (requires API key in reality)
        await new Promise(r => setTimeout(r, 1000));
        setResults([
          { 
            title: `${searchQuery} (CurseForge)`, 
            description: "CurseForge API requires a private API key to fetch real data. This is a mock result to show the UI integration.", 
            downloads: 1200500, 
            author: "CF_Developer", 
            icon_url: "https://curseforge.com/favicon.ico",
            project_id: "mock-1"
          },
          { 
            title: `Better ${searchQuery}`, 
            description: "Another mock result for CurseForge.", 
            downloads: 450000, 
            author: "Modder123", 
            icon_url: "",
            project_id: "mock-2"
          }
        ]);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const formatDownloads = (num: number) => {
    if (num >= 1000000) return (num / 1000000).toFixed(1) + 'M';
    if (num >= 1000) return (num / 1000).toFixed(1) + 'K';
    return num.toString();
  };

  return (
    <div className="min-h-screen bg-gray-50 text-gray-900 flex flex-col">
      <header className="border-b border-gray-200 bg-white/50 backdrop-blur-xl px-6 py-4 flex items-center justify-between sticky top-0 z-10">
        <div className="flex items-center gap-4">
          <Link to="/dashboard" className="p-2 hover:bg-gray-100 rounded-full transition-colors">
            <ArrowLeft className="w-5 h-5 text-gray-600" />
          </Link>
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-indigo-50 border border-indigo-100 flex items-center justify-center shadow-sm">
              <Globe className="w-4 h-4 text-indigo-500" />
            </div>
            <span className="font-semibold tracking-tight">Addon Browser</span>
          </div>
        </div>
        
        <div className="flex items-center gap-2 bg-gray-100 p-1 rounded-lg">
          <button 
            onClick={() => { setPlatform('modrinth'); setResults([]); }}
            className={`px-4 py-1.5 text-sm font-medium rounded-md transition-all ${platform === 'modrinth' ? 'bg-white shadow-sm text-green-600' : 'text-gray-500 hover:text-gray-700'}`}
          >
            Modrinth
          </button>
          <button 
            onClick={() => { setPlatform('curseforge'); setResults([]); }}
            className={`px-4 py-1.5 text-sm font-medium rounded-md transition-all ${platform === 'curseforge' ? 'bg-white shadow-sm text-orange-600' : 'text-gray-500 hover:text-gray-700'}`}
          >
            CurseForge
          </button>
        </div>
      </header>

      <main className="flex-1 p-6 md:p-8 max-w-7xl mx-auto w-full flex flex-col">
        {/* Search Bar */}
        <div className="bg-white p-4 rounded-2xl shadow-sm border border-gray-200 mb-8 flex flex-col sm:flex-row gap-4">
          <div className="relative flex-1">
            <Search className="w-5 h-5 absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
            <input 
              type="text" 
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && searchAddons()}
              placeholder={`Search for ${type}s on ${platform === 'modrinth' ? 'Modrinth' : 'CurseForge'}...`}
              className="w-full pl-12 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all"
            />
          </div>
          
          <div className="flex gap-2">
            <select 
              value={type} 
              onChange={(e) => setType(e.target.value as 'mod' | 'plugin')}
              className="px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 text-sm font-medium"
            >
              <option value="mod">Mods</option>
              <option value="plugin">Plugins</option>
            </select>
            
            <Button variant="primary" onClick={() => searchAddons()} className="px-8 bg-indigo-600 hover:bg-indigo-700 text-white">
              {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Search'}
            </Button>
          </div>
        </div>

        {/* Results Grid */}
        <div className="flex-1">
          {loading ? (
            <div className="flex flex-col items-center justify-center h-64 text-gray-500">
              <Loader2 className="w-8 h-8 animate-spin mb-4 text-indigo-500" />
              <p>Searching {platform} database...</p>
            </div>
          ) : results.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {results.map((item, i) => (
                <motion.div 
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.05 }}
                  key={item.project_id || i}
                  className="bg-white border border-gray-200 rounded-2xl p-5 hover:shadow-md hover:border-indigo-200 transition-all flex flex-col h-full group"
                >
                  <div className="flex items-start gap-4 mb-4">
                    {item.icon_url ? (
                      <img src={item.icon_url} alt={item.title} className="w-14 h-14 rounded-xl object-cover bg-gray-100 border border-gray-200" />
                    ) : (
                      <div className="w-14 h-14 rounded-xl bg-gray-100 border border-gray-200 flex items-center justify-center shrink-0">
                        <Package className="w-6 h-6 text-gray-400" />
                      </div>
                    )}
                    <div className="flex-1 min-w-0">
                      <h3 className="font-semibold text-gray-900 truncate group-hover:text-indigo-600 transition-colors" title={item.title}>
                        {item.title}
                      </h3>
                      <p className="text-sm text-gray-500 truncate">by {item.author}</p>
                    </div>
                  </div>
                  
                  <p className="text-sm text-gray-600 line-clamp-3 mb-4 flex-1">
                    {item.description}
                  </p>
                  
                  <div className="flex items-center justify-between pt-4 border-t border-gray-100 mt-auto">
                    <div className="flex items-center gap-1.5 text-sm text-gray-500 font-medium">
                      <Download className="w-4 h-4" />
                      {formatDownloads(item.downloads)}
                    </div>
                    
                    <a 
                      href={platform === 'modrinth' ? `https://modrinth.com/${type}/${item.slug}` : '#'} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="p-2 text-gray-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors"
                    >
                      <ExternalLink className="w-4 h-4" />
                    </a>
                  </div>
                </motion.div>
              ))}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center h-64 text-gray-500 text-center">
              <Package className="w-12 h-12 text-gray-300 mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-1">No results found</h3>
              <p className="text-sm">Try adjusting your search terms or switching platforms.</p>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
