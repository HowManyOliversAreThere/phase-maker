import { useState, useEffect } from 'react';
import { AlertCircle, Home } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

interface ErrorBoundaryProps {
    children: React.ReactNode;
}

interface ErrorBoundaryState {
    hasError: boolean;
    error?: Error;
}

export function ErrorBoundary({ children }: ErrorBoundaryProps) {
    const [error, setError] = useState<ErrorBoundaryState>({ hasError: false });

    useEffect(() => {
        const handleError = (event: ErrorEvent) => {
            setError({
                hasError: true,
                error: new Error(event.message)
            });
        };

        const handleUnhandledRejection = (event: PromiseRejectionEvent) => {
            setError({
                hasError: true,
                error: new Error(event.reason?.toString() || 'Unhandled promise rejection')
            });
        };

        window.addEventListener('error', handleError);
        window.addEventListener('unhandledrejection', handleUnhandledRejection);

        return () => {
            window.removeEventListener('error', handleError);
            window.removeEventListener('unhandledrejection', handleUnhandledRejection);
        };
    }, []);

    const resetError = () => {
        setError({ hasError: false });
        window.location.reload();
    };

    if (error.hasError) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-[#0443A7] via-[#0275C5] to-[#009224] flex items-center justify-center p-4">
                <Card className="max-w-md mx-auto border-0 shadow-xl bg-white">
                    <CardHeader className="text-center">
                        <div className="mx-auto w-16 h-16 bg-[#FB041E] rounded-full flex items-center justify-center mb-4">
                            <AlertCircle className="w-8 h-8 text-white" />
                        </div>
                        <CardTitle className="text-[#0443A7] text-2xl">
                            Oops! Something went wrong
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="text-center space-y-4">
                        <p className="text-[#0443A7]/80">
                            We encountered an error while generating your Phase 10 set. Don't worry, this happens sometimes!
                        </p>
                        <Button
                            onClick={resetError}
                            className="bg-[#FB041E] hover:bg-[#FB041E]/90 text-white"
                        >
                            <Home className="w-4 h-4 mr-2" />
                            Start Over
                        </Button>
                    </CardContent>
                </Card>
            </div>
        );
    }

    return <>{children}</>;
}
