import React from 'react';
import { SearchEngineFallbackMeta, SearchEngineType } from '../types';
import { Globe, ExternalLink, Sparkles, CheckCircle2 } from 'lucide-react';

interface SearchEngineFallbackBannerProps {
  fallback: SearchEngineFallbackMeta;
}

export const SearchEngineFallbackBanner: React.FC<SearchEngineFallbackBannerProps> = ({ fallback }) => {
  return (
    <div className="p-4 sm:p-5 rounded-2xl bg-gradient-to-r from-blue-950/40 via-purple-950/40 to-emerald-950/40 border border-sky-600/50 shadow-lg space-y-3.5 animate-in fade-in duration-200">
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-sky-800/40 pb-2.5">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-full bg-sky-500/20 border border-sky-400/40 flex items-center justify-center text-sky-300">
            <Globe className="w-4 h-4" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-semibold text-white">Live Search Engine Grounding Active</span>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-sky-900/80 text-sky-300 border border-sky-700/60">
                Tokens Reached Fallback
              </span>
            </div>
            <p className="text-[11px] text-[#c4c7c5] mt-0.5">
              Grounded with live documentation & answers from Google, Microsoft Edge, and Firefox.
            </p>
          </div>
        </div>

        {/* 1-Click Search Engine Direct Quick-Launch Links */}
        <div className="flex items-center gap-1.5 flex-wrap">
          <a
            href={fallback.googleUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-medium bg-[#1e1f20] hover:bg-[#282a2c] text-sky-300 border border-sky-700/50 hover:border-sky-400 transition-all shadow-xs cursor-pointer"
            title="Search on Google"
          >
            <span>Google</span>
            <ExternalLink className="w-3 h-3 text-sky-400" />
          </a>
          <a
            href={fallback.edgeUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-medium bg-[#1e1f20] hover:bg-[#282a2c] text-emerald-300 border border-emerald-700/50 hover:border-emerald-400 transition-all shadow-xs cursor-pointer"
            title="Search on Microsoft Edge / Bing"
          >
            <span>MS Edge</span>
            <ExternalLink className="w-3 h-3 text-emerald-400" />
          </a>
          <a
            href={fallback.firefoxUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-medium bg-[#1e1f20] hover:bg-[#282a2c] text-amber-300 border border-amber-700/50 hover:border-amber-400 transition-all shadow-xs cursor-pointer"
            title="Search on Firefox / DuckDuckGo"
          >
            <span>Firefox</span>
            <ExternalLink className="w-3 h-3 text-amber-400" />
          </a>
        </div>
      </div>

      {/* Verified Web Sources */}
      {fallback.webSources && fallback.webSources.length > 0 && (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1">
          {fallback.webSources.map((src, i) => (
            <a
              key={i}
              href={src.url}
              target="_blank"
              rel="noopener noreferrer"
              className="p-2.5 rounded-xl bg-[#131314]/70 hover:bg-[#131314] border border-[#282a2c] hover:border-sky-500/50 transition-all group block text-left"
            >
              <div className="flex items-center justify-between text-[11px] text-sky-400 font-semibold mb-0.5">
                <span className="truncate group-hover:underline">{src.title}</span>
                <span className="text-[10px] text-[#8e918f] font-mono shrink-0 ml-1">{src.domain}</span>
              </div>
              <p className="text-[11px] text-[#8e918f] line-clamp-2 leading-relaxed">
                {src.snippet}
              </p>
            </a>
          ))}
        </div>
      )}
    </div>
  );
};
