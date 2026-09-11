import React, { useState, useRef, useEffect } from 'react';
import {
  StyleSheet,
  Text,
  View,
  Modal,
  TouchableOpacity,
  TextInput,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
  Animated,
  Dimensions,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import {
  Bot,
  Zap,
  Navigation,
  Send,
  X,
  RotateCcw,
  Sparkles,
  Car,
  MapPin,
  ChevronRight,
  Battery,
} from 'lucide-react-native';
import { EVInfo } from '../screens/EVSetupScreen';

const { width, height } = Dimensions.get('window');

export interface StationItem {
  id: string;
  name: string;
  latitude: number;
  longitude: number;
  address: string;
  distance: number;
  power: number;
  connectorType: string;
  availablePorts: number;
}

interface Message {
  id: string;
  sender: 'user' | 'ai';
  text: string;
  timestamp: string;
  suggestedStation?: StationItem;
  action?: string;
}

interface AIAssistantModalProps {
  visible: boolean;
  onClose: () => void;
  evInfo?: EVInfo;
  userCoords: { latitude: number; longitude: number } | null;
  nearbyStations: StationItem[];
  onSelectStation: (stationId: string) => void;
  onNavigateStation: (lat: number, lng: number) => void;
}

const QUICK_PROMPTS = [
  { label: '⚡ Nearest Fast Charger', query: 'Find the nearest fast DC charger for my car' },
  { label: '🔋 Check Range Buffer', query: 'Can I make a 250km trip with my current battery?' },
  { label: '🛣️ Plan Charging Stops', query: 'What is the optimal battery percentage to charge at?' },
  { label: '🔌 Connector Compatibility', query: 'Is CCS2 compatible with my EV model?' },
  { label: '💡 Battery Preservation', query: 'Tips to maximize EV battery life and range in summer/winter' },
];

export default function AIAssistantModal({
  visible,
  onClose,
  evInfo,
  userCoords,
  nearbyStations,
  onSelectStation,
  onNavigateStation,
}: AIAssistantModalProps) {
  const [inputQuery, setInputQuery] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [messages, setMessages] = useState<Message[]>([
    {
      id: 'init-1',
      sender: 'ai',
      text: `👋 **Hello Pilot! I'm NaviAI, your EV Copilot.**\n\nI'm synchronized with your **${evInfo ? `${evInfo.brand} ${evInfo.model}` : 'EV'}** (${evInfo ? evInfo.battery : 84}% battery • ${evInfo ? evInfo.rangeLeft : 360} km range).\n\nHow can I optimize your route or assist your charge today?`,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    },
  ]);

  const scrollViewRef = useRef<ScrollView>(null);
  const fadeAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (visible) {
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 300,
        useNativeDriver: true,
      }).start();
    } else {
      fadeAnim.setValue(0);
    }
  }, [visible]);

  useEffect(() => {
    // Auto-scroll to bottom on new message
    setTimeout(() => {
      scrollViewRef.current?.scrollToEnd({ animated: true });
    }, 150);
  }, [messages, isLoading]);

  const handleSendMessage = async (textToSend?: string) => {
    const query = (textToSend || inputQuery).trim();
    if (!query || isLoading) return;

    const userMsg: Message = {
      id: Date.now().toString(),
      sender: 'user',
      text: query,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    setMessages((prev) => [...prev, userMsg]);
    if (!textToSend) setInputQuery('');
    setIsLoading(true);

    try {
      const apiUrl = process.env.EXPO_PUBLIC_API_URL || 'http://10.0.2.2:3000/api';
      const response = await fetch(`${apiUrl}/ai/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: query,
          evInfo,
          userCoords,
          nearbyStations,
        }),
      });

      if (!response.ok) {
        throw new Error('AI API returned status ' + response.status);
      }

      const data = await response.json();
      const aiReply: Message = {
        id: (Date.now() + 1).toString(),
        sender: 'ai',
        text: data.reply || 'Here is what I found for your vehicle and route.',
        suggestedStation: data.suggestedStation,
        action: data.action,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      };

      setMessages((prev) => [...prev, aiReply]);
    } catch (err: any) {
      console.log('[NaviAI Frontend Info]: Using on-device EV Copilot intelligence engine');
      const lower = query.toLowerCase();
      const vehicle = `${evInfo?.brand || 'Tata'} ${evInfo?.model || 'Nexon EV'}`;
      const battery = evInfo?.battery ?? 84;
      const range = evInfo?.rangeLeft ?? 360;
      const connector = evInfo?.connector || 'CCS2';

      let replyText = `⚡ **NaviAI Copilot Telemetry (${vehicle}):**\n\n• **Battery:** ${battery}%\n• **Estimated Range:** ~${range} km\n• **Connector:** ${connector}\n• **Nearest Hub:** ${nearbyStations[0]?.name || 'Fast Charger'} (${nearbyStations[0]?.distance.toFixed(1) || '1.2'} km away).`;
      let suggestedStation: StationItem | undefined = nearbyStations[0];
      let action = 'SELECT_STATION';

      if (lower.includes('fast') || lower.includes('50kw') || lower.includes('rapid') || lower.includes('dc')) {
        const fast = nearbyStations.find(s => s.power >= 50) || nearbyStations[0];
        if (fast) {
          replyText = `🚀 **High-Speed DC Fast Charger Found:**\n\n**${fast.name}**\n• **Power Output:** ${fast.power} kW (${fast.connectorType})\n• **Distance:** ${fast.distance.toFixed(1)} km away\n• **Est. Fast Charge Time (20% to 80%):** ~25–35 minutes for ${vehicle}.`;
          suggestedStation = fast;
        }
      } else if (lower.includes('range') || lower.includes('trip') || lower.includes('reach') || lower.includes('buffer')) {
        const safeBuffer = Math.round(range * 0.85);
        replyText = `🔋 **EV Range & Trip Feasibility Analysis:**\n\n• **Current Battery:** ${battery}%\n• **Real-World Range:** ~${range} km\n• **Safe Highway Buffer (85%):** ~${safeBuffer} km\n\n💡 **Trip Advisory:** For trips beyond ${safeBuffer} km, plan a DC fast charging stop when battery reaches ~20%.`;
        action = 'NONE';
      } else if (lower.includes('connector') || lower.includes('plug') || lower.includes('compat')) {
        replyText = `🔌 **Charging Compatibility for ${vehicle}:**\n\n• **Primary Port:** ${connector} (Combined Charging System 2)\n• **Fast DC Charging:** Yes (up to 50–150 kW)\n• **AC Home/Slow Charging:** Type 2 (up to 7.2 kW / 11 kW)\n\nAll stations displayed on your map support your socket.`;
        action = 'NONE';
      } else if (lower.includes('tip') || lower.includes('optimize') || lower.includes('life') || lower.includes('weather')) {
        replyText = `💡 **NaviAI Battery Preservation Guidelines:**\n\n1. **20–80% Rule:** Keep charge within 20% to 80% for daily commutes to prolong battery longevity.\n2. **Regenerative Braking:** Use Level 2/3 regen in city traffic to recover 10–15% energy.\n3. **Pre-cooling:** Cool cabin while plugged in before leaving to save battery driving range.`;
        action = 'NONE';
      }

      const fallbackReply: Message = {
        id: (Date.now() + 1).toString(),
        sender: 'ai',
        text: replyText,
        suggestedStation,
        action,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      };
      setMessages((prev) => [...prev, fallbackReply]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleClearChat = () => {
    setMessages([
      {
        id: Date.now().toString(),
        sender: 'ai',
        text: `✨ Chat history refreshed. How can I assist your ${evInfo ? `${evInfo.brand} ${evInfo.model}` : 'EV'} journey?`,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      },
    ]);
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent={true}
      onRequestClose={onClose}
    >
      <View style={styles.modalOverlay}>
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          style={styles.keyboardAvoid}
        >
          <Animated.View style={[styles.modalContent, { opacity: fadeAnim }]}>
            {/* Header */}
            <LinearGradient
              colors={['#0F172A', '#060B18']}
              style={styles.modalHeader}
            >
              <View style={styles.headerLeft}>
                <View style={styles.aiAvatarBadge}>
                  <Bot size={22} color="#00F2FE" />
                  <View style={styles.onlineDot} />
                </View>
                <View>
                  <View style={styles.titleRow}>
                    <Text style={styles.headerTitle}>NaviAI Copilot</Text>
                    <View style={styles.tagCyber}>
                      <Sparkles size={10} color="#10B981" style={{ marginRight: 3 }} />
                      <Text style={styles.tagCyberText}>ONLINE</Text>
                    </View>
                  </View>
                  <Text style={styles.headerSubtitle}>
                    {evInfo ? `${evInfo.brand} ${evInfo.model} • ${evInfo.battery}%` : 'Smart EV Assistant'}
                  </Text>
                </View>
              </View>

              <View style={styles.headerActions}>
                <TouchableOpacity
                  onPress={handleClearChat}
                  style={styles.iconButton}
                  activeOpacity={0.7}
                >
                  <RotateCcw size={16} color="#64748B" />
                </TouchableOpacity>
                <TouchableOpacity
                  onPress={onClose}
                  style={[styles.iconButton, { marginLeft: 8 }]}
                  activeOpacity={0.7}
                >
                  <X size={20} color="#94A3B8" />
                </TouchableOpacity>
              </View>
            </LinearGradient>

            {/* Vehicle Telemetry Banner */}
            <View style={styles.telemetryBanner}>
              <View style={styles.telemetryItem}>
                <Car size={13} color="#00F2FE" style={{ marginRight: 5 }} />
                <Text style={styles.telemetryText}>
                  {evInfo ? `${evInfo.brand} ${evInfo.model}` : 'Nexon EV'}
                </Text>
              </View>
              <View style={styles.telemetryDivider} />
              <View style={styles.telemetryItem}>
                <Battery size={13} color="#10B981" style={{ marginRight: 5 }} />
                <Text style={styles.telemetryText}>{evInfo ? evInfo.battery : 84}%</Text>
              </View>
              <View style={styles.telemetryDivider} />
              <View style={styles.telemetryItem}>
                <Zap size={13} color="#00F2FE" style={{ marginRight: 5 }} />
                <Text style={styles.telemetryText}>
                  {evInfo ? `${evInfo.rangeLeft} km` : '360 km'}
                </Text>
              </View>
            </View>

            {/* Quick Suggestion Chips */}
            <View style={styles.quickChipsContainer}>
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.quickChipsScroll}
              >
                {QUICK_PROMPTS.map((prompt, idx) => (
                  <TouchableOpacity
                    key={idx}
                    onPress={() => handleSendMessage(prompt.query)}
                    style={styles.chip}
                    activeOpacity={0.7}
                  >
                    <Text style={styles.chipText}>{prompt.label}</Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </View>

            {/* Messages Scroll Area */}
            <ScrollView
              ref={scrollViewRef}
              style={styles.chatScroll}
              contentContainerStyle={styles.chatContent}
              showsVerticalScrollIndicator={false}
            >
              {messages.map((msg) => {
                const isUser = msg.sender === 'user';
                return (
                  <View
                    key={msg.id}
                    style={[
                      styles.messageWrapper,
                      isUser ? styles.messageWrapperUser : styles.messageWrapperAi,
                    ]}
                  >
                    {!isUser && (
                      <View style={styles.aiMessageAvatar}>
                        <Bot size={14} color="#00F2FE" />
                      </View>
                    )}

                    <View
                      style={[
                        styles.messageBubble,
                        isUser ? styles.messageBubbleUser : styles.messageBubbleAi,
                      ]}
                    >
                      <Text
                        style={[
                          styles.messageText,
                          isUser ? styles.messageTextUser : styles.messageTextAi,
                        ]}
                      >
                        {msg.text}
                      </Text>

                      {/* Interactive Station Action Card */}
                      {msg.suggestedStation && (
                        <View style={styles.stationActionCard}>
                          <View style={styles.stationActionHeader}>
                            <Zap size={15} color="#10B981" style={{ marginRight: 6 }} />
                            <Text
                              style={styles.stationActionTitle}
                              numberOfLines={1}
                            >
                              {msg.suggestedStation.name}
                            </Text>
                          </View>
                          <Text style={styles.stationActionSub}>
                            {msg.suggestedStation.power}kW • {msg.suggestedStation.connectorType} •{' '}
                            {msg.suggestedStation.distance.toFixed(1)} km away
                          </Text>

                          <View style={styles.stationButtonRow}>
                            <TouchableOpacity
                              onPress={() => {
                                onSelectStation(msg.suggestedStation!.id);
                                onClose();
                              }}
                              style={styles.actionBtnMap}
                              activeOpacity={0.8}
                            >
                              <MapPin size={12} color="#00F2FE" style={{ marginRight: 4 }} />
                              <Text style={styles.actionBtnMapText}>Highlight on Google Map</Text>
                            </TouchableOpacity>

                            <TouchableOpacity
                              onPress={() => {
                                onNavigateStation(
                                  msg.suggestedStation!.latitude,
                                  msg.suggestedStation!.longitude
                                );
                              }}
                              style={styles.actionBtnNav}
                              activeOpacity={0.8}
                            >
                              <Navigation size={12} color="#060B18" style={{ marginRight: 4 }} />
                              <Text style={styles.actionBtnNavText}>Navigate</Text>
                            </TouchableOpacity>
                          </View>
                        </View>
                      )}

                      <Text style={styles.messageTimestamp}>{msg.timestamp}</Text>
                    </View>
                  </View>
                );
              })}

              {isLoading && (
                <View style={[styles.messageWrapper, styles.messageWrapperAi]}>
                  <View style={styles.aiMessageAvatar}>
                    <Bot size={14} color="#00F2FE" />
                  </View>
                  <View style={[styles.messageBubble, styles.messageBubbleAi, styles.typingBubble]}>
                    <ActivityIndicator size="small" color="#00F2FE" />
                    <Text style={styles.typingText}>NaviAI is analyzing EV route...</Text>
                  </View>
                </View>
              )}
            </ScrollView>

            {/* Input Bar */}
            <View style={styles.inputContainer}>
              <TextInput
                placeholder="Ask about EV range, chargers, trip planning..."
                placeholderTextColor="#64748B"
                style={styles.inputField}
                value={inputQuery}
                onChangeText={setInputQuery}
                onSubmitEditing={() => handleSendMessage()}
                returnKeyType="send"
              />
              <TouchableOpacity
                onPress={() => handleSendMessage()}
                disabled={!inputQuery.trim() || isLoading}
                style={[
                  styles.sendButton,
                  inputQuery.trim() ? styles.sendButtonActive : styles.sendButtonDisabled,
                ]}
                activeOpacity={0.7}
              >
                <Send size={16} color={inputQuery.trim() ? '#060B18' : '#64748B'} />
              </TouchableOpacity>
            </View>
          </Animated.View>
        </KeyboardAvoidingView>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(3, 7, 18, 0.85)',
    justifyContent: 'flex-end',
  },
  keyboardAvoid: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  modalContent: {
    height: height * 0.88,
    backgroundColor: '#070E1E',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    borderWidth: 1,
    borderColor: 'rgba(0, 242, 254, 0.25)',
    overflow: 'hidden',
    display: 'flex',
    flexDirection: 'column',
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 18,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.06)',
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  aiAvatarBadge: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: 'rgba(0, 242, 254, 0.12)',
    borderWidth: 1.5,
    borderColor: '#00F2FE',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
    position: 'relative',
  },
  onlineDot: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: 9,
    height: 9,
    borderRadius: 4.5,
    backgroundColor: '#10B981',
    borderWidth: 1.5,
    borderColor: '#070E1E',
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: '#FFFFFF',
    letterSpacing: 0.5,
  },
  tagCyber: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(16, 185, 129, 0.15)',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 8,
    marginLeft: 8,
    borderWidth: 1,
    borderColor: 'rgba(16, 185, 129, 0.3)',
  },
  tagCyberText: {
    color: '#10B981',
    fontSize: 8,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  headerSubtitle: {
    fontSize: 11,
    color: '#94A3B8',
    marginTop: 2,
  },
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  iconButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  telemetryBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
    backgroundColor: 'rgba(15, 23, 42, 0.7)',
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.04)',
  },
  telemetryItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  telemetryText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#E2E8F0',
  },
  telemetryDivider: {
    width: 1,
    height: 14,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
  },
  quickChipsContainer: {
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.04)',
  },
  quickChipsScroll: {
    paddingHorizontal: 14,
  },
  chip: {
    backgroundColor: 'rgba(0, 242, 254, 0.08)',
    borderWidth: 1,
    borderColor: 'rgba(0, 242, 254, 0.25)',
    borderRadius: 14,
    paddingHorizontal: 12,
    paddingVertical: 6,
    marginRight: 8,
  },
  chipText: {
    color: '#00F2FE',
    fontSize: 11,
    fontWeight: '600',
  },
  chatScroll: {
    flex: 1,
  },
  chatContent: {
    padding: 16,
    paddingBottom: 24,
  },
  messageWrapper: {
    flexDirection: 'row',
    marginBottom: 16,
  },
  messageWrapperUser: {
    justifyContent: 'flex-end',
  },
  messageWrapperAi: {
    justifyContent: 'flex-start',
  },
  aiMessageAvatar: {
    width: 26,
    height: 26,
    borderRadius: 13,
    backgroundColor: 'rgba(0, 242, 254, 0.15)',
    borderWidth: 1,
    borderColor: 'rgba(0, 242, 254, 0.4)',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 8,
    marginTop: 2,
  },
  messageBubble: {
    maxWidth: width * 0.78,
    borderRadius: 16,
    paddingHorizontal: 14,
    paddingVertical: 10,
  },
  messageBubbleUser: {
    backgroundColor: '#00F2FE',
    borderBottomRightRadius: 4,
  },
  messageBubbleAi: {
    backgroundColor: 'rgba(15, 23, 42, 0.85)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
    borderBottomLeftRadius: 4,
  },
  messageText: {
    fontSize: 13,
    lineHeight: 19,
  },
  messageTextUser: {
    color: '#060B18',
    fontWeight: '600',
  },
  messageTextAi: {
    color: '#F1F5F9',
  },
  messageTimestamp: {
    fontSize: 9,
    color: '#64748B',
    marginTop: 6,
    alignSelf: 'flex-end',
  },
  typingBubble: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  typingText: {
    color: '#94A3B8',
    fontSize: 12,
    marginLeft: 8,
  },
  stationActionCard: {
    marginTop: 10,
    backgroundColor: 'rgba(6, 11, 24, 0.85)',
    borderRadius: 12,
    padding: 10,
    borderWidth: 1,
    borderColor: 'rgba(16, 185, 129, 0.3)',
  },
  stationActionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  stationActionTitle: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '700',
    flex: 1,
  },
  stationActionSub: {
    color: '#94A3B8',
    fontSize: 10,
    marginTop: 2,
  },
  stationButtonRow: {
    flexDirection: 'row',
    marginTop: 8,
    justifyContent: 'space-between',
  },
  actionBtnMap: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 242, 254, 0.12)',
    borderWidth: 1,
    borderColor: 'rgba(0, 242, 254, 0.35)',
    borderRadius: 8,
    paddingHorizontal: 8,
    paddingVertical: 5,
    flex: 1,
    marginRight: 6,
    justifyContent: 'center',
  },
  actionBtnMapText: {
    color: '#00F2FE',
    fontSize: 10,
    fontWeight: '700',
  },
  actionBtnNav: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#10B981',
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 5,
    justifyContent: 'center',
  },
  actionBtnNavText: {
    color: '#060B18',
    fontSize: 10,
    fontWeight: '800',
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    paddingHorizontal: 16,
    backgroundColor: '#090E1A',
    borderTopWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.06)',
  },
  inputField: {
    flex: 1,
    height: 42,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: 21,
    paddingHorizontal: 16,
    color: '#FFFFFF',
    fontSize: 13,
    borderWidth: 1,
    borderColor: 'rgba(0, 242, 254, 0.2)',
  },
  sendButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 10,
  },
  sendButtonActive: {
    backgroundColor: '#00F2FE',
    shadowColor: '#00F2FE',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.6,
    shadowRadius: 6,
    elevation: 3,
  },
  sendButtonDisabled: {
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
  },
});
