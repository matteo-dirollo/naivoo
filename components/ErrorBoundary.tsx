import React from "react";
import { View, Text, TouchableOpacity } from "react-native";

interface Props {
  children: React.ReactNode;
  // Called when the user taps "Try again" — use this to clear whatever
  // bad state likely caused the crash (e.g. clearActiveTrip()) before
  // the boundary re-renders its children.
  onReset?: () => void;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends React.Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, info: React.ErrorInfo) {
    // This is the log line to grep for if you hit a white screen again —
    // it will tell you exactly what threw and where, instead of nothing.
    console.error("ErrorBoundary caught an error:", error, info.componentStack);
  }

  handleReset = () => {
    this.props.onReset?.();
    this.setState({ hasError: false, error: null });
  };

  render() {
    if (this.state.hasError) {
      return (
        <View className="flex-1 items-center justify-center bg-[#141714] px-8">
          <Text className="text-white text-lg font-semibold mb-2 text-center">
            Something went wrong
          </Text>
          <Text className="text-[#849081] text-sm mb-6 text-center">
            {this.state.error?.message ?? "An unexpected error occurred."}
          </Text>
          <TouchableOpacity
            className="bg-brand-500 rounded-md px-6 py-3"
            onPress={this.handleReset}
            activeOpacity={0.8}
          >
            <Text className="text-background-900 font-medium">Try again</Text>
          </TouchableOpacity>
        </View>
      );
    }

    return this.props.children;
  }
}
