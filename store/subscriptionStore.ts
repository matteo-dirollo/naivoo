import { create } from "zustand";
import { fetchAPI } from "@/lib/fetch";
import { SubscriptionStatus } from "@/types/type";

interface SubscriptionState {
  status: SubscriptionStatus;
  trialEndsAt: string | null;
  currentPeriodEnd: string | null;
  cancelAtPeriodEnd: boolean;
  isLoading: boolean;
  isCancelling: boolean;
  hasAccess: boolean; // allowed past the paywall gate at all
  hasFullAccess: boolean; // trialing/active — unlocks optimize route etc.
  fetchSubscriptionStatus: (userId: string) => Promise<void>;
  cancelSubscription: (userId: string) => Promise<void>;
  clearSubscription: () => void;
}

const FULL_ACCESS_STATUSES: SubscriptionStatus[] = ["trialing", "active"];
const APP_ACCESS_STATUSES: SubscriptionStatus[] = [
  "trialing",
  "active",
  "past_due",
  "canceled",
];

export const useSubscriptionStore = create<SubscriptionState>((set, get) => ({
  status: "unknown",
  trialEndsAt: null,
  currentPeriodEnd: null,
  cancelAtPeriodEnd: false,
  isLoading: false,
  isCancelling: false,
  hasAccess: false,
  hasFullAccess: false,

  fetchSubscriptionStatus: async (userId: string) => {
    set({ isLoading: true });
    try {
      const response = await fetchAPI(`/(api)/subscription/${userId}`, {
        method: "GET",
      });

      const status: SubscriptionStatus = response?.status ?? "none";

      set({
        status,
        trialEndsAt: response?.trial_end ?? null,
        currentPeriodEnd: response?.current_period_end ?? null,
        cancelAtPeriodEnd: response?.cancel_at_period_end ?? false,
        hasAccess: APP_ACCESS_STATUSES.includes(status),
        hasFullAccess: FULL_ACCESS_STATUSES.includes(status),
        isLoading: false,
      });
    } catch (error) {
      console.error("Failed to fetch subscription status:", error);
      set({
        status: "none",
        hasAccess: false,
        hasFullAccess: false,
        isLoading: false,
      });
    }
  },

  cancelSubscription: async (userId: string) => {
    const previous = get();
    set({ isCancelling: true, cancelAtPeriodEnd: true });

    try {
      const response = await fetchAPI("/(api)/stripe/cancel", {
        method: "POST",
        body: JSON.stringify({ userId }),
      });
      if (response?.error) throw new Error(response.error);

      set({
        status: response.status ?? previous.status,
        cancelAtPeriodEnd: response.cancelAtPeriodEnd ?? true,
        isCancelling: false,
      });
    } catch (error) {
      console.error("Failed to cancel subscription:", error);
      set({
        cancelAtPeriodEnd: previous.cancelAtPeriodEnd,
        isCancelling: false,
      });
      throw error;
    }
  },

  clearSubscription: () =>
    set({
      status: "unknown",
      trialEndsAt: null,
      currentPeriodEnd: null,
      cancelAtPeriodEnd: false,
      hasAccess: false,
      hasFullAccess: false,
    }),
}));
