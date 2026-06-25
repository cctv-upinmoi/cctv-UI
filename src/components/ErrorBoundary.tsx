import React from 'react';
import { useTranslation } from 'react-i18next';
import { AlertTriangle, RotateCcw } from 'lucide-react';
import styles from './ErrorBoundary.module.css';

interface Props {
    children: React.ReactNode;
}

interface State {
    hasError: boolean;
    error: Error | null;
}

function ErrorFallback({ onReset }: { onReset: () => void }) {
    const { t } = useTranslation();
    return (
        <div className={styles.container}>
            <AlertTriangle size={48} className={styles.icon} />
            <h1 className={styles.title}>{t('errorBoundary.title')}</h1>
            <p className={styles.message}>{t('errorBoundary.message')}</p>
            <button className={styles.button} onClick={onReset}>
                <RotateCcw size={16} />
                {t('errorBoundary.retry')}
            </button>
        </div>
    );
}

class ErrorBoundary extends React.Component<Props, State> {
    state: State = { hasError: false, error: null };

    static getDerivedStateFromError(error: Error): State {
        return { hasError: true, error };
    }

    componentDidCatch(error: Error, info: React.ErrorInfo) {
        // Surface the render error in the console for debugging instead of a silent blank screen.
        console.error('Uncaught render error:', error, info);
    }

    handleReset = () => {
        this.setState({ hasError: false, error: null });
    };

    render() {
        if (this.state.hasError) {
            return <ErrorFallback onReset={this.handleReset} />;
        }
        return this.props.children;
    }
}

export default ErrorBoundary;
