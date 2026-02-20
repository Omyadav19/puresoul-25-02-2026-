import React, { createContext, useContext, useState, useEffect } from 'react';
import { useApp } from './AppContext';
import { API_BASE_URL } from '../utils/apiConfig';

const CreditContext = createContext(undefined);

export const useCredits = () => {
    const context = useContext(CreditContext);
    if (!context) {
        throw new Error('useCredits must be used within a CreditProvider');
    }
    return context;
};

export const CreditProvider = ({ children }) => {
    const { user } = useApp();
    const [credits, setCredits] = useState(user?.credits || 12);
    const [isLoading, setIsLoading] = useState(false);

    // Sync credits from user object in AppContext if it changes
    useEffect(() => {
        if (user) {
            setCredits(user.credits);
        }
    }, [user]);

    const refreshCredits = async () => {
        if (!user) return;
        setIsLoading(true);
        try {
            const token = localStorage.getItem('authToken');
            const response = await fetch(`${API_BASE_URL}/api/credits`, {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });
            if (response.ok) {
                const data = await response.json();
                setCredits(data.credits);
            }
        } catch (error) {
            console.error('Failed to refresh credits:', error);
        } finally {
            setIsLoading(false);
        }
    };

    const consumeCredit = async () => {
        if (!user) return;
        try {
            const token = localStorage.getItem('authToken');
            const response = await fetch(`${API_BASE_URL}/api/credits/use`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });
            if (response.ok) {
                const data = await response.json();
                setCredits(data.credits);
                return true;
            }
            return false;
        } catch (error) {
            console.error('Failed to consume credit:', error);
            return false;
        }
    };

    const addCredits = async (amount) => {
        if (!user) return;
        try {
            const token = localStorage.getItem('authToken');
            const response = await fetch(`${API_BASE_URL}/api/credits/buy`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({ amount })
            });
            if (response.ok) {
                const data = await response.json();
                setCredits(data.credits);
            }
        } catch (error) {
            console.error('Failed to add credits:', error);
        }
    };

    return (
        <CreditContext.Provider value={{
            credits,
            consumeCredit,
            addCredits,
            refreshCredits,
            isLoading
        }}>
            {children}
        </CreditContext.Provider>
    );
};
