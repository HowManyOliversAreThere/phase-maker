import { useState, useEffect } from 'react';
import { Shuffle, Share2, RotateCcw, Info, CheckCircle, AlertCircle } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/components/ui/toast';
import { generatePhaseSet, generatePhaseSetFromId, parsePhaseSetFromUrl, generateShareableUrl, rerollSinglePhase } from '@/utils/phaseGenerator';
import type { PhaseSet } from '@/types/phase';

const DIFFICULTY_COLORS = {
    1: 'bg-emerald-500 hover:bg-emerald-600',
    2: 'bg-emerald-600 hover:bg-emerald-700',
    3: 'bg-yellow-500 hover:bg-yellow-600',
    4: 'bg-yellow-600 hover:bg-yellow-700',
    5: 'bg-orange-500 hover:bg-orange-600',
    6: 'bg-orange-600 hover:bg-orange-700',
    7: 'bg-red-500 hover:bg-red-600',
    8: 'bg-red-600 hover:bg-red-700',
    9: 'bg-purple-500 hover:bg-purple-600',
    10: 'bg-purple-600 hover:bg-purple-700',
};

const DIFFICULTY_LABELS = {
    1: 'Very Easy',
    2: 'Easy',
    3: 'Easy',
    4: 'Medium',
    5: 'Medium',
    6: 'Medium',
    7: 'Hard',
    8: 'Hard',
    9: 'Very Hard',
    10: 'Extreme',
};

export default function PhaseGenerator() {
    const [phaseSet, setPhaseSet] = useState<PhaseSet | null>(null);
    const [isGenerating, setIsGenerating] = useState(false);
    const [shareUrl, setShareUrl] = useState('');
    const [shareStatus, setShareStatus] = useState<'idle' | 'success' | 'error'>('idle');
    const [isLoading, setIsLoading] = useState(true);
    const [showContent, setShowContent] = useState(false);
    const [rerollingPhases, setRerollingPhases] = useState<Set<number>>(new Set());

    const { showToast } = useToast();

    // Load phase set from URL on component mount
    useEffect(() => {
        const loadInitialPhaseSet = async () => {
            // Ensure loading state is visible
            setIsLoading(true);
            setShowContent(false);

            const urlPhaseSetId = parsePhaseSetFromUrl();

            if (urlPhaseSetId) {
                try {
                    const loadedPhaseSet = generatePhaseSetFromId(urlPhaseSetId);
                    setPhaseSet(loadedPhaseSet);
                    setShareUrl(generateShareableUrl(urlPhaseSetId));
                } catch (error) {
                    console.error('Error loading phase set from URL:', error);
                    await generateNewPhaseSet();
                }
            } else {
                await generateNewPhaseSet();
            }

            // Small delay to ensure smooth transition
            setTimeout(() => {
                setIsLoading(false);
                setShowContent(true);
            }, 100);
        };

        loadInitialPhaseSet();
    }, []);

    const generateNewPhaseSet = async () => {
        setIsGenerating(true);
        setRerollingPhases(new Set()); // Clear any ongoing reroll states

        // Add a small delay for better UX
        await new Promise(resolve => setTimeout(resolve, 800));

        try {
            const newPhaseSet = generatePhaseSet();
            setPhaseSet(newPhaseSet);
            setShareUrl(generateShareableUrl(newPhaseSet.id));

            // Update URL without page reload
            const url = new URL(window.location.href);
            url.searchParams.set('set', newPhaseSet.id);
            window.history.pushState({}, '', url.toString());
        } catch (error) {
            console.error('Error generating phase set:', error);
            setShareStatus('error');
            setTimeout(() => setShareStatus('idle'), 3000);
        }

        setIsGenerating(false);
    };

    const sharePhaseSet = async () => {
        if (!phaseSet) return;

        try {
            if ('share' in navigator && typeof navigator.share === 'function') {
                // Use native sharing API on mobile devices
                await navigator.share({
                    title: 'Phase Maker - Custom Phase 10 Set',
                    text: `Check out this custom Phase 10 set I generated!`,
                    url: shareUrl,
                });
                showToast('Shared successfully!');
            } else if (navigator.clipboard) {
                // Use clipboard API
                await navigator.clipboard.writeText(shareUrl);
                showToast('Link copied to clipboard!');
            } else {
                // Fallback for older browsers
                const textArea = document.createElement('textarea');
                textArea.value = shareUrl;
                textArea.style.position = 'fixed';
                textArea.style.opacity = '0';
                document.body.appendChild(textArea);
                textArea.select();
                const successful = document.execCommand('copy');
                document.body.removeChild(textArea);

                if (successful) {
                    showToast('Link copied to clipboard!');
                } else {
                    showToast('Failed to copy link', 'error');
                }
            }
        } catch (error) {
            console.error('Error sharing:', error);
            showToast('Failed to share link', 'error');
        }
    };

    const rerollPhase = async (phaseId: number) => {
        if (!phaseSet || rerollingPhases.has(phaseId)) return;

        setRerollingPhases(prev => new Set([...prev, phaseId]));

        // Add a small delay for better UX
        await new Promise(resolve => setTimeout(resolve, 300));

        try {
            const otherPhases = phaseSet.phases.filter(p => p.id !== phaseId);
            const newPhase = rerollSinglePhase(phaseId, otherPhases);

            // Create new phase set with the rerolled phase, keeping original positions
            const updatedPhases = phaseSet.phases.map(p => p.id === phaseId ? newPhase : p);

            // Create updated phase set with new timestamp to indicate change
            const updatedPhaseSet = {
                ...phaseSet,
                phases: updatedPhases,
                createdAt: new Date() // Update timestamp to show it was modified
            };

            setPhaseSet(updatedPhaseSet);

            // Note: We keep the same share URL since we're not changing the fundamental set ID
            // Users can still share this modified version

        } catch (error) {
            console.error('Error rerolling phase:', error);
        } finally {
            setRerollingPhases(prev => {
                const newSet = new Set(prev);
                newSet.delete(phaseId);
                return newSet;
            });
        }
    }; const getDifficultyColor = (difficulty: number): string => {
        return DIFFICULTY_COLORS[difficulty as keyof typeof DIFFICULTY_COLORS] || 'bg-gray-500';
    };

    const getDifficultyLabel = (difficulty: number): string => {
        return DIFFICULTY_LABELS[difficulty as keyof typeof DIFFICULTY_LABELS] || 'Unknown';
    };

    if (isLoading || !showContent) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-[#0443A7] via-[#0275C5] to-[#009224] flex items-center justify-center">
                <div className="text-center">
                    <div className="w-16 h-16 border-4 border-white border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
                    <p className="text-white text-xl font-medium">Loading your Phase 10 set...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-[#0443A7] via-[#0275C5] to-[#009224] p-4 animate-in fade-in duration-500">
            <div className="max-w-6xl mx-auto">
                {/* Header */}
                <div className="text-center mb-8 animate-in fade-in duration-700">
                    <h1 className="text-4xl md:text-6xl lg:text-7xl font-bold text-white mb-4 tracking-tight">
                        Phase Maker
                    </h1>
                    <p className="text-lg md:text-xl lg:text-2xl text-white/90 mb-6 max-w-3xl mx-auto leading-relaxed">
                        Generate random Phase 10 sets for endless replayability.
                    </p>

                    {/* Action Buttons */}
                    <div className="flex flex-wrap justify-center gap-4 mb-6">
                        <Button
                            onClick={generateNewPhaseSet}
                            disabled={isGenerating}
                            className="bg-[#FB041E] hover:bg-[#FB041E]/90 text-white px-8 py-4 text-lg font-bold shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105"
                            size="lg"
                        >
                            {isGenerating ? (
                                <>
                                    <RotateCcw className="w-6 h-6 mr-3 animate-spin" />
                                    Generating...
                                </>
                            ) : (
                                <>
                                    <Shuffle className="w-6 h-6 mr-3" />
                                    Generate New Set
                                </>
                            )}
                        </Button>

                        {phaseSet && (
                            <Button
                                onClick={sharePhaseSet}
                                variant="outline"
                                className="border-2 border-white text-white hover:bg-white hover:text-[#0443A7] px-8 py-4 text-lg font-bold shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105"
                                size="lg"
                            >
                                <Share2 className="w-6 h-6 mr-3" />
                                Share Set
                            </Button>
                        )}
                    </div>

                    {/* Share Status Messages */}
                    {shareStatus === 'success' && (
                        <div className="bg-[#009224] text-white px-6 py-3 rounded-lg inline-flex items-center gap-2 mb-4 animate-in slide-in-from-top duration-300">
                            <CheckCircle className="w-5 h-5" />
                            {'share' in navigator ? 'Shared successfully!' : 'Link copied to clipboard!'}
                        </div>
                    )}

                    {shareStatus === 'error' && (
                        <div className="bg-[#FB041E] text-white px-6 py-3 rounded-lg inline-flex items-center gap-2 mb-4 animate-in slide-in-from-top duration-300">
                            <AlertCircle className="w-5 h-5" />
                            Failed to share. Please try again.
                        </div>
                    )}
                </div>

                {/* Phase Set Display */}
                {phaseSet && (
                    <div className="space-y-6 animate-in fade-in slide-in-from-bottom duration-700 delay-300">
                        {/* Phases Grid */}
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 xl:grid-cols-3 gap-6">
                            {phaseSet.phases.map((phase, index) => (
                                <Card
                                    key={phase.id}
                                    className="border-0 shadow-xl hover:shadow-2xl transition-all duration-500 bg-white group hover:-translate-y-1 animate-in slide-in-from-bottom duration-500"
                                    style={{ animationDelay: `${index * 100}ms` }}
                                >
                                    <CardHeader className="pb-4">
                                        <div className="flex items-center justify-between">
                                            <CardTitle className="text-[#0443A7] text-2xl font-bold flex items-center gap-3">
                                                <span className="w-8 h-8 rounded-full bg-[#0443A7] text-white flex items-center justify-center text-sm font-bold">
                                                    {phase.id}
                                                </span>
                                                Phase {phase.id}
                                            </CardTitle>
                                            <div className="flex items-center gap-2 flex-wrap">
                                                <Badge
                                                    className={`${getDifficultyColor(phase.difficulty)} text-white px-3 py-1.5 font-bold shadow-md transition-all duration-200`}
                                                >
                                                    {getDifficultyLabel(phase.difficulty)}
                                                </Badge>
                                            </div>
                                        </div>
                                    </CardHeader>
                                    <CardContent className="pt-0">
                                        <p className="text-lg text-[#0443A7] font-semibold leading-relaxed mb-4">
                                            {phase.description}
                                        </p>
                                        <div className="flex items-center justify-between mb-4">
                                            <div className="text-sm text-[#0443A7]/70 font-medium">
                                                <div>Cards needed: {phase.cardCount}</div>
                                                <div>Difficulty: {phase.difficulty}/10</div>
                                            </div>
                                            <Button
                                                onClick={() => rerollPhase(phase.id)}
                                                disabled={rerollingPhases.has(phase.id) || isGenerating}
                                                variant="outline"
                                                size="sm"
                                                className="border-[#0443A7] text-white bg-[#0443A7] hover:bg-white hover:text-[#0443A7] transition-all duration-200 opacity-0 group-hover:opacity-100 disabled:opacity-50"
                                            >
                                                {isGenerating ? (
                                                    <>
                                                        <RotateCcw className="w-4 h-4 mr-2 animate-spin" />
                                                        Loading...
                                                    </>
                                                ) : rerollingPhases.has(phase.id) ? (
                                                    <>
                                                        <RotateCcw className="w-4 h-4 mr-2 animate-spin" />
                                                        Rerolling...
                                                    </>
                                                ) : (
                                                    <>
                                                        <Shuffle className="w-4 h-4 mr-2" />
                                                        Reroll
                                                    </>
                                                )}
                                            </Button>
                                        </div>
                                    </CardContent>
                                </Card>
                            ))}
                        </div>

                        {/* Game Rules Info */}
                        <Card className="border-0 shadow-xl bg-white overflow-hidden mt-12 animate-in fade-in slide-in-from-bottom duration-700 delay-700">
                            <CardHeader className="bg-gradient-to-r from-[#FCD700] to-[#FCD700]/80 -m-px">
                                <CardTitle className="text-[#0443A7] flex items-center gap-3 text-2xl font-bold">
                                    <Info className="w-6 h-6" />
                                    Phase 10 Rules Reference
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="text-[#0443A7] space-y-4 bg-white">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <div>
                                        <h3 className="font-bold text-lg mb-3 text-[#FB041E]">Phase Types:</h3>
                                        <ul className="space-y-2 text-sm leading-relaxed">
                                            <li><strong>Set:</strong> Multiple cards of the same number (any color)</li>
                                            <li><strong>Run:</strong> Cards in consecutive numerical order (any color)</li>
                                            <li><strong>Color:</strong> Cards of the same color (any numbers)</li>
                                            <li><strong>Even/Odd:</strong> Cards that are all even (2,4,6,8,10,12) or all odd (1,3,5,7,9,11)</li>
                                            <li><strong>Color Run:</strong> Cards in consecutive order of the same color</li>
                                        </ul>
                                    </div>
                                    <div>
                                        <h3 className="font-bold text-lg mb-3 text-[#FB041E]">Game Rules:</h3>
                                        <ul className="space-y-2 text-sm leading-relaxed">
                                            <li>Complete phases in order from 1 to 10 to win</li>
                                            <li>Wild cards can substitute for any card in any phase</li>
                                            <li>You must complete your current phase before advancing</li>
                                            <li>Failed phases must be attempted again next round</li>
                                            <li>First player to complete all 10 phases wins!</li>
                                        </ul>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    </div>
                )}

                {/* Footer */}
                <footer className="text-center text-white/70 mt-16 py-8 border-t border-white/20">
                    <p className="text-sm">
                        Made with ❤️ for Phase 10 enthusiasts • Share your custom sets and keep the game fresh!
                    </p>
                </footer>
            </div>
        </div>
    );
}
