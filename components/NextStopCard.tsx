import React from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Animated,
} from "react-native";
import {
  CheckCircle,
  SkipForward,
  ChevronLeft,
  ChevronRight,
  MapPin,
  Clock,
  Ruler,
  Navigation,
} from "lucide-react-native";
import { TripMarker } from "@/types/type";

interface NextStopCardProps {
  stop: TripMarker;
  stopNumber: number;
  totalStops: number;
  onMarkDone: () => void;
  onSkip: () => void;
  onPrev: () => void;
  onNext: () => void;
  canGoPrev: boolean;
  canGoNext: boolean;
  isLastStop: boolean;
  onFinishTrip?: () => void;
}

function formatDistance(meters: number): string {
  if (meters < 1000) return `${Math.round(meters)} m`;
  return `${(meters / 1000).toFixed(1)} km`;
}

function formatDuration(seconds: number): string {
  if (seconds < 60) return `${Math.round(seconds)} sec`;
  const mins = Math.round(seconds / 60);
  if (mins < 60) return `${mins} min`;
  const hrs = Math.floor(mins / 60);
  const rem = mins % 60;
  return rem > 0 ? `${hrs}h ${rem}m` : `${hrs}h`;
}

const NextStopCard: React.FC<NextStopCardProps> = ({
  stop,
  stopNumber,
  totalStops,
  onMarkDone,
  onSkip,
  onPrev,
  onNext,
  canGoPrev,
  canGoNext,
  isLastStop,
  onFinishTrip,
}) => {
  const distanceText = stop.expected_distance
    ? formatDistance(stop.expected_distance)
    : null;
  const durationText = stop.expected_duration
    ? formatDuration(stop.expected_duration)
    : null;

  return (
    <View style={styles.container}>
      {/* Header row: stop counter + nav arrows */}
      <View style={styles.headerRow}>
        <TouchableOpacity
          onPress={onPrev}
          disabled={!canGoPrev}
          style={[styles.arrowBtn, !canGoPrev && styles.arrowBtnDisabled]}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
        >
          <ChevronLeft
            size={20}
            color={canGoPrev ? "#1ed7b5" : "#444"}
            strokeWidth={2}
          />
        </TouchableOpacity>

        <View style={styles.stopCounter}>
          <Navigation size={12} color="#1ed7b5" strokeWidth={2} />
          <Text style={styles.stopCounterText}>
            Stop {stopNumber} of {totalStops}
          </Text>
        </View>

        <TouchableOpacity
          onPress={onNext}
          disabled={!canGoNext}
          style={[styles.arrowBtn, !canGoNext && styles.arrowBtnDisabled]}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
        >
          <ChevronRight
            size={20}
            color={canGoNext ? "#1ed7b5" : "#444"}
            strokeWidth={2}
          />
        </TouchableOpacity>
      </View>

      {/* Address */}
      <View style={styles.addressRow}>
        <MapPin size={16} color="#1ed7b5" strokeWidth={1.5} />
        <Text style={styles.addressText} numberOfLines={2}>
          {stop.location.address}
        </Text>
      </View>

      {/* Distance / Duration pills */}
      {(distanceText || durationText) && (
        <View style={styles.metaRow}>
          {distanceText && (
            <View style={styles.metaPill}>
              <Ruler size={12} color="#849081" strokeWidth={1.5} />
              <Text style={styles.metaText}>{distanceText}</Text>
            </View>
          )}
          {durationText && (
            <View style={styles.metaPill}>
              <Clock size={12} color="#849081" strokeWidth={1.5} />
              <Text style={styles.metaText}>{durationText}</Text>
            </View>
          )}
        </View>
      )}

      {/* Action buttons */}
      <View style={styles.actionRow}>
        {/* Skip */}
        <TouchableOpacity
          style={styles.skipBtn}
          onPress={onSkip}
          activeOpacity={0.75}
        >
          <SkipForward size={16} color="#849081" strokeWidth={1.5} />
          <Text style={styles.skipText}>Skip</Text>
        </TouchableOpacity>

        {/* Mark done / Finish trip */}
        <TouchableOpacity
          style={styles.doneBtn}
          onPress={isLastStop ? onFinishTrip : onMarkDone}
          activeOpacity={0.8}
        >
          <CheckCircle size={18} color="#141714" strokeWidth={2} />
          <Text style={styles.doneText}>
            {isLastStop ? "Finish Trip" : "Mark as Done"}
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 20,
    paddingTop: 8,
    paddingBottom: 16,
    gap: 12,
  },
  headerRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  arrowBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "#1F1F1F",
    alignItems: "center",
    justifyContent: "center",
  },
  arrowBtnDisabled: {
    backgroundColor: "#191919",
  },
  stopCounter: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  stopCounterText: {
    color: "#849081",
    fontSize: 13,
    fontWeight: "500",
  },
  addressRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 10,
    paddingHorizontal: 4,
  },
  addressText: {
    flex: 1,
    color: "#ffffff",
    fontSize: 16,
    fontWeight: "600",
    lineHeight: 22,
  },
  metaRow: {
    flexDirection: "row",
    gap: 10,
    paddingHorizontal: 4,
  },
  metaPill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    backgroundColor: "#1F1F1F",
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 20,
  },
  metaText: {
    color: "#849081",
    fontSize: 12,
    fontWeight: "500",
  },
  actionRow: {
    flexDirection: "row",
    gap: 10,
    marginTop: 4,
  },
  skipBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "#2a2a2a",
    backgroundColor: "transparent",
  },
  skipText: {
    color: "#849081",
    fontSize: 14,
    fontWeight: "500",
  },
  doneBtn: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    paddingVertical: 12,
    borderRadius: 10,
    backgroundColor: "#1ed7b5",
  },
  doneText: {
    color: "#141714",
    fontSize: 15,
    fontWeight: "700",
  },
});

export default NextStopCard;
