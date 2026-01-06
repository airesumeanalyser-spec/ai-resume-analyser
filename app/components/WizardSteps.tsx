/**
 * Wizard Steps Component
 * Step-by-step guided workflow for resume creation
 */

import { ArrowRight, ArrowLeft, Check } from 'lucide-react';

export interface WizardStep {
    id: string;
    number: number;
    title: string;
    description: string;
    icon: string;
    isCompleted: boolean;
    isCurrent: boolean;
}

interface WizardStepsProps {
    steps: WizardStep[];
    currentStepId: string;
    onNext?: () => void;
    onPrevious?: () => void;
    onStepClick?: (stepId: string) => void;
    nextLabel?: string;
    previousLabel?: string;
    canProceed?: boolean;
}

export function WizardSteps({
    steps,
    currentStepId,
    onNext,
    onPrevious,
    onStepClick,
    nextLabel = 'Continue',
    previousLabel = 'Back',
    canProceed = true,
}: WizardStepsProps) {
    const currentIndex = steps.findIndex(s => s.id === currentStepId);
    const isFirstStep = currentIndex === 0;
    const isLastStep = currentIndex === steps.length - 1;

    return (
        <div className="space-y-6">
            {/* Steps Progress Bar */}
            <div className="relative">
                {/* Progress Line */}
                <div className="absolute top-8 left-0 right-0 h-1 bg-gray-200">
                    <div
                        className="h-full bg-gradient-to-r from-blue-500 to-purple-600 transition-all duration-500"
                        style={{
                            width: `${(steps.filter(s => s.isCompleted).length / steps.length) * 100}%`,
                        }}
                    />
                </div>

                {/* Step Indicators */}
                <div className="relative flex justify-between">
                    {steps.map((step, index) => {
                        const isClickable = step.isCompleted || step.isCurrent;
                        
                        return (
                            <button
                                key={step.id}
                                onClick={() => isClickable && onStepClick?.(step.id)}
                                disabled={!isClickable}
                                className={`flex flex-col items-center gap-2 transition-all ${
                                    isClickable ? 'cursor-pointer hover:scale-110' : 'cursor-not-allowed'
                                }`}
                            >
                                {/* Step Circle */}
                                <div
                                    className={`w-16 h-16 rounded-full flex items-center justify-center text-2xl font-bold transition-all duration-300 ${
                                        step.isCompleted
                                            ? 'bg-gradient-to-r from-green-500 to-green-600 text-white shadow-lg scale-110'
                                            : step.isCurrent
                                            ? 'bg-gradient-to-r from-blue-500 to-purple-600 text-white shadow-lg scale-110 animate-pulse'
                                            : 'bg-gray-200 text-gray-500'
                                    }`}
                                >
                                    {step.isCompleted ? (
                                        <Check className="w-8 h-8" />
                                    ) : (
                                        <span>{step.icon}</span>
                                    )}
                                </div>

                                {/* Step Label */}
                                <div className="text-center max-w-[120px]">
                                    <div
                                        className={`text-xs font-semibold mb-1 ${
                                            step.isCurrent
                                                ? 'text-blue-600'
                                                : step.isCompleted
                                                ? 'text-green-600'
                                                : 'text-gray-500'
                                        }`}
                                    >
                                        Step {step.number}
                                    </div>
                                    <div
                                        className={`text-sm font-medium ${
                                            step.isCurrent ? 'text-gray-900' : 'text-gray-600'
                                        }`}
                                    >
                                        {step.title}
                                    </div>
                                    <div className="text-xs text-gray-500 mt-1">
                                        {step.description}
                                    </div>
                                </div>
                            </button>
                        );
                    })}
                </div>
            </div>

            {/* Navigation Buttons */}
            <div className="flex items-center justify-between pt-6 border-t border-gray-200">
                <button
                    onClick={onPrevious}
                    disabled={isFirstStep}
                    className="flex items-center gap-2 px-6 py-3 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                >
                    <ArrowLeft className="w-4 h-4" />
                    {previousLabel}
                </button>

                <div className="text-center">
                    <div className="text-sm text-gray-600">
                        Step <span className="font-bold text-gray-900">{currentIndex + 1}</span> of{' '}
                        <span className="font-bold text-gray-900">{steps.length}</span>
                    </div>
                    <div className="text-xs text-gray-500 mt-1">
                        {Math.round(((currentIndex + 1) / steps.length) * 100)}% Complete
                    </div>
                </div>

                <button
                    onClick={onNext}
                    disabled={!canProceed}
                    className={`flex items-center gap-2 px-6 py-3 text-sm font-medium text-white rounded-lg transition-all ${
                        canProceed
                            ? 'bg-gradient-to-r from-blue-500 to-purple-600 hover:shadow-lg hover:scale-105'
                            : 'bg-gray-300 cursor-not-allowed'
                    }`}
                >
                    {isLastStep ? 'Finish' : nextLabel}
                    {!isLastStep && <ArrowRight className="w-4 h-4" />}
                </button>
            </div>
        </div>
    );
}

/**
 * Mini Wizard Progress (for compact display)
 */
interface MiniWizardProgressProps {
    currentStep: number;
    totalSteps: number;
    stepNames: string[];
}

export function MiniWizardProgress({ currentStep, totalSteps, stepNames }: MiniWizardProgressProps) {
    const progress = ((currentStep + 1) / totalSteps) * 100;

    return (
        <div className="flex items-center gap-3">
            {/* Progress Dots */}
            <div className="flex gap-2">
                {Array.from({ length: totalSteps }).map((_, index) => (
                    <div
                        key={index}
                        className={`w-2 h-2 rounded-full transition-all ${
                            index < currentStep
                                ? 'bg-green-500 scale-110'
                                : index === currentStep
                                ? 'bg-blue-500 scale-125 animate-pulse'
                                : 'bg-gray-300'
                        }`}
                    />
                ))}
            </div>

            {/* Current Step Label */}
            <div className="text-xs font-medium text-gray-700">
                {stepNames[currentStep]}
            </div>

            {/* Progress Percentage */}
            <div className="text-xs text-gray-500">
                {Math.round(progress)}%
            </div>
        </div>
    );
}
