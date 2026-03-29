import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { Plus, Trash2, Save, Code, X } from 'lucide-react';
import Editor from '@monaco-editor/react';
import * as adminApi from '../admin.api';
import Button from '../../../components/ui/Button';
import Input from '../../../components/ui/Input';
import Card from '../../../components/ui/Card';

const QuestionForm = ({ quizId, editingQuestionId, onSuccess, onCancel, initialData }) => {
  const [questionData, setQuestionData] = useState({
    quizId: quizId,
    questionText: '',
    image: '',
    codeSnippet: '',
    programmingLanguage: 'javascript',
    options: [
      { text: '', isCorrect: true },
      { text: '', isCorrect: false },
      { text: '', isCorrect: false },
      { text: '', isCorrect: false }
    ],
    numberOfCorrectAnswers: 1,
    order: 1
  });

  useEffect(() => {
    if (initialData) {
      setQuestionData({
        ...initialData,
        image: initialData.image || '',
        codeSnippet: initialData.codeSnippet || '',
        programmingLanguage: initialData.programmingLanguage || 'javascript',
        options: initialData.options.map(o => ({ ...o }))
      });
    } else {
      setQuestionData({
        quizId: quizId,
        questionText: '',
        image: '',
        codeSnippet: '',
        programmingLanguage: 'javascript',
        options: [
          { text: '', isCorrect: true },
          { text: '', isCorrect: false },
          { text: '', isCorrect: false },
          { text: '', isCorrect: false }
        ],
        numberOfCorrectAnswers: 1,
        order: 1
      });
    }
  }, [initialData, quizId]);

  const handleOptionChange = (index, field, value) => {
    const newOptions = [...questionData.options];
    newOptions[index] = { ...newOptions[index], [field]: value };
    
    // If setting isCorrect to true for single choice, uncheck others
    if (field === 'isCorrect' && value && questionData.numberOfCorrectAnswers === 1) {
      newOptions.forEach((opt, i) => {
        if (i !== index) opt.isCorrect = false;
      });
    }
    
    setQuestionData({ ...questionData, options: newOptions });
  };

  const addOption = () => {
    setQuestionData({
      ...questionData,
      options: [...questionData.options, { text: '', isCorrect: false }]
    });
  };

  const removeOption = (index) => {
    if (questionData.options.length <= 2) return;
    const newOptions = questionData.options.filter((_, i) => i !== index);
    setQuestionData({ ...questionData, options: newOptions });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editingQuestionId) {
        await adminApi.updateQuestion(editingQuestionId, questionData);
      } else {
        await adminApi.createQuestion(questionData);
      }
      onSuccess();
    } catch (error) {
      console.error('Failed to save question:', error);
    }
  };

  return (
    <Card className="p-10 space-y-8" hover={false}>
      <div className="flex items-center justify-between">
        <h3 className="text-2xl font-bold text-white">
          {editingQuestionId ? 'Edit Question' : 'Add New Question'}
        </h3>
        {editingQuestionId && (
          <Button variant="ghost" onClick={onCancel} icon={X}>Cancel Edit</Button>
        )}
      </div>

      <form onSubmit={handleSubmit} className="space-y-8">
        <div className="space-y-6">
          <Input 
            label="Question Text"
            placeholder="Enter your question here..."
            value={questionData.questionText}
            onChange={(e) => setQuestionData({ ...questionData, questionText: e.target.value })}
            required
          />

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Input 
              label="Image URL (Optional)"
              placeholder="https://example.com/image.png"
              value={questionData.image}
              onChange={(e) => setQuestionData({ ...questionData, image: e.target.value })}
            />
            <div className="space-y-4">
              <label className="text-xs font-bold text-gray-500 uppercase tracking-widest">
                Correct Answers
              </label>
              <select
                value={questionData.numberOfCorrectAnswers}
                onChange={(e) => setQuestionData({ ...questionData, numberOfCorrectAnswers: parseInt(e.target.value) })}
                className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-orange-500 transition-all"
              >
                <option value={1}>Single Choice</option>
                <option value={2}>Multiple Choice (2 correct)</option>
                <option value={3}>Multiple Choice (3 correct)</option>
              </select>
            </div>
          </div>

          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold text-gray-500 uppercase tracking-widest flex items-center gap-2">
                <Code size={14} />
                Code Snippet (Optional)
              </label>
              <select
                value={questionData.programmingLanguage}
                onChange={(e) => setQuestionData({ ...questionData, programmingLanguage: e.target.value })}
                className="bg-white/5 border border-white/10 rounded-lg px-3 py-1 text-xs text-gray-400 focus:outline-none focus:border-orange-500"
              >
                <option value="javascript">JavaScript</option>
                <option value="python">Python</option>
                <option value="java">Java</option>
                <option value="cpp">C++</option>
                <option value="html">HTML</option>
                <option value="css">CSS</option>
              </select>
            </div>
            <div className="h-64 rounded-xl overflow-hidden border border-white/10">
              <Editor
                height="100%"
                defaultLanguage={questionData.programmingLanguage}
                language={questionData.programmingLanguage}
                theme="vs-dark"
                value={questionData.codeSnippet}
                onChange={(value) => setQuestionData({ ...questionData, codeSnippet: value })}
                options={{
                  minimap: { enabled: false },
                  fontSize: 14,
                  lineNumbers: 'on',
                  scrollBeyondLastLine: false,
                  automaticLayout: true,
                  padding: { top: 16, bottom: 16 }
                }}
              />
            </div>
          </div>

          <div className="space-y-4">
            <label className="text-xs font-bold text-gray-500 uppercase tracking-widest">
              Options
            </label>
            <div className="grid grid-cols-1 gap-4">
              {questionData.options.map((option, index) => (
                <div key={index} className="flex items-center gap-4 group">
                  <div className="flex-1 relative">
                    <input
                      type="text"
                      placeholder={`Option ${index + 1}`}
                      value={option.text}
                      onChange={(e) => handleOptionChange(index, 'text', e.target.value)}
                      className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-orange-500 transition-all pr-12"
                      required
                    />
                    <button
                      type="button"
                      onClick={() => handleOptionChange(index, 'isCorrect', !option.isCorrect)}
                      className={`absolute right-3 top-1/2 -translate-y-1/2 w-8 h-8 rounded-lg flex items-center justify-center transition-all ${
                        option.isCorrect ? 'bg-green-500 text-white' : 'bg-white/5 text-gray-500 hover:text-white'
                      }`}
                    >
                      <Plus size={18} className={option.isCorrect ? 'rotate-45' : ''} />
                    </button>
                  </div>
                  <button
                    type="button"
                    onClick={() => removeOption(index)}
                    className="p-3 text-gray-600 hover:text-red-500 transition-colors opacity-0 group-hover:opacity-100"
                  >
                    <Trash2 size={18} />
                  </button>
                </div>
              ))}
            </div>
            <Button variant="secondary" onClick={addOption} icon={PlusCircle} className="w-full">
              Add Option
            </Button>
          </div>
        </div>

        <Button type="submit" className="w-full" icon={Save}>
          {editingQuestionId ? 'Update Question' : 'Save Question'}
        </Button>
      </form>
    </Card>
  );
};

export default QuestionForm;
