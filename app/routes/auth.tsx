import React, {useEffect, useMemo, useRef, useState} from "react";
import {useApiStore} from "~/lib/api";
import Footer from "~/components/Footer";
import {useLocation, useNavigate} from "react-router";

export const meta =() => ([
    { title: 'AI Resume Builder | Auth'},
    { name: 'description', content: 'An account where you are logged in.' },
])

const Auth = () => {
    const { isLoading, auth, error } = useApiStore();
    const location = useLocation();
    const params = new URLSearchParams(location.search);
    const nextParam = params.get('next');
    const next = nextParam ? decodeURIComponent(nextParam) : '/';
    const oauthError = params.get('error') || params.get('error_description');
    const code = params.get('code');
    const state = params.get('state');
    const navigate = useNavigate();

    const triedRef = useRef(false);



    useEffect(() => {
        // When landing from OAuth, check/capture session then redirect
        if (!triedRef.current) {
            triedRef.current = true;
            if (auth?.checkAuthStatus) {
                auth.checkAuthStatus();
                // small retry to stabilize after redirect
                setTimeout(() => auth.checkAuthStatus && auth.checkAuthStatus(), 300);
            }
        }
        if (auth.isAuthenticated) navigate(next || '/');
    },  [auth.isAuthenticated, next, navigate, auth]);

    const helpText = useMemo(() => {
        if (oauthError) return `OAuth error: ${oauthError}`;
        if (error) return `Auth error: ${error}`;
        return '';
    }, [oauthError, error]);

    return (
        <main className="bg-[url('/images/bg-auth.svg')] bg-cover min-h-screen flex flex-col">
            <div className="flex-1 flex items-center justify-center">
                <div className="gradient-border shadow-lg">
                    <section className="flex flex-col gap-8 bg-white rounded-2xl p-10">
                        <div className="flex flex-col items-center gap-2 text-center">
                            <h1>Welcome</h1>
                            <h2>Log In to Continue Your Job Journey</h2>
                            {(code || state || helpText) && (
                                <p className="text-xs text-dark-200 break-all">
                                    {code && `code=${code} `}
                                    {state && `state=${state} `}
                                    {helpText}
                                </p>
                            )}
                        </div>
                        <div>
                            {isLoading ? (
                                <button className="auth-button animate-pulse" aria-busy>
                                    <p>Signing You In…</p>
                                </button>
                            ) : (
                                <>
                                    {auth.isAuthenticated ? (
                                        <button className="auth-button" onClick={auth.signOut}>
                                            <p>Log Out</p>
                                        </button>
                                    ) : (
                                        <div className="flex flex-col gap-2">
                                            <button className="auth-button" onClick={auth.signIn}>
                                                <p>Continue with Google</p>
                                            </button>
                                            {helpText && (
                                                <p className="text-xs text-red-500 text-center">{helpText}</p>
                                            )}
                                        </div>
                                    )}
                                </>
                            )}
                        </div>
                    </section>
                </div>
            </div>
            <Footer />
        </main>
    )
}

export default Auth;