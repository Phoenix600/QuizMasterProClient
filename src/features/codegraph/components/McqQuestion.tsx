import React from 'react';
import { HelpCircle, CheckCircle2, Circle } from 'lucide-react';
import { cn } from '../lib/utils';

interface McqQuestionProps {
  question: any;
  selectedOptionId: string | null;
  onSelect: (optionId: string) => void;
}

export const McqQuestion: React.FC<McqQuestionProps> = ({ question, selectedOptionId, onSelect }) => {
  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="space-y-4">
        <div className="flex items-start gap-4">
           <div className="p-2 bg-orange-500/10 rounded-lg shrink-0">
              <HelpCircle className="text-orange-500" size={20} />
           </div>
           <h3 className="text-xl font-bold text-zinc-100 leading-relaxed tracking-tight">
             {question.questionText}
           </h3>
        </div>
        {question.image && (
          <div className="rounded-2xl overflow-hidden border border-zinc-800">
             <img src={question.image} alt="Question" className="max-w-full h-auto" />
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 gap-4">
        {question.options.map((option: any, index: number) => {
          const isSelected = String(selectedOptionId) === String(index);
          return (
            <button
              key={index}
              onClick={() => onSelect(String(index))}
              className={cn(
                "group relative flex items-center justify-between p-6 rounded-2xl border-2 transition-all text-left",
                isSelected 
                  ? "bg-orange-500/10 border-orange-500 shadow-lg shadow-orange-500/10" 
                  : "bg-zinc-900/50 border-zinc-800 hover:border-zinc-700 hover:bg-zinc-800/50"
              )}
            >
              <div className="flex items-center gap-4">
                <div className={cn(
                  "w-6 h-6 rounded-full border-2 flex items-center justify-center transition-all",
                  isSelected ? "border-orange-500 bg-orange-500" : "border-zinc-700 text-transparent"
                )}>
                   <CheckCircle2 size={14} className="text-white" />
                </div>
                <span className={cn(
                   "text-base lg:text-lg font-medium transition-colors",
                   isSelected ? "text-white" : "text-zinc-400 group-hover:text-zinc-200"
                )}>
                   {option.text || option.optionText}
                </span>
              </div>
              
              {isSelected && (
                <div className="absolute right-6 w-2 h-2 rounded-full bg-orange-500 animate-pulse" />
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
};
