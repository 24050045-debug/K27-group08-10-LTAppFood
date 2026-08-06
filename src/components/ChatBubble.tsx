import { Ionicons } from '@expo/vector-icons';
import React, { useCallback, useRef, useState } from 'react';
import {
  Animated,
  Dimensions,
  FlatList,
  KeyboardAvoidingView,
  Platform,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { COLORS } from '../constants/theme';
import { API_URL } from '../constants';

const ORANGE = COLORS.primary;
const { height: SCREEN_H, width: SCREEN_W } = Dimensions.get('window');

type Message = {
  id: string;
  text: string;
  sender: 'user' | 'support';
  time: string;
};

const INITIAL_MESSAGES: Message[] = [
  {
    id: '1',
    text: 'Xin chào! 👋 Chào mừng bạn đến với hỗ trợ FoodApp.',
    sender: 'support',
    time: '08:00',
  },
  {
    id: '2',
    text: 'Hãy nhắn tin cho chúng tôi nếu bạn cần giúp đỡ — nhân viên hỗ trợ sẽ phản hồi bạn trực tiếp tại đây!',
    sender: 'support',
    time: '08:00',
  },
];

const AUTO_REPLY_TEXT = 'Chúng tôi đã nhận được tin nhắn của bạn! 🙏 Nhân viên hỗ trợ sẽ phản hồi trực tiếp tại đây trong thời gian sớm nhất.';

function getNow() {
  const d = new Date();
  return `${d.getHours().toString().padStart(2, '0')}:${d.getMinutes().toString().padStart(2, '0')}`;
}

export default function ChatBubble() {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>(INITIAL_MESSAGES);
  const [text, setText] = useState('');
  const [typing, setTyping] = useState(false);
  const [unread, setUnread] = useState(2);
  const [hasAutoReplied, setHasAutoReplied] = useState(false);

  const scaleAnim = useRef(new Animated.Value(1)).current;
  const slideAnim = useRef(new Animated.Value(300)).current;
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const flatRef = useRef<FlatList>(null);

  // Pulse animation on bubble
  React.useEffect(() => {
    const pulse = Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, { toValue: 1.12, duration: 900, useNativeDriver: true }),
        Animated.timing(pulseAnim, { toValue: 1, duration: 900, useNativeDriver: true }),
      ])
    );
    pulse.start();
    return () => pulse.stop();
  }, []);

  const openChat = () => {
    setOpen(true);
    setUnread(0);
    Animated.parallel([
      Animated.spring(slideAnim, { toValue: 0, tension: 65, friction: 10, useNativeDriver: true }),
      Animated.timing(fadeAnim, { toValue: 1, duration: 220, useNativeDriver: true }),
    ]).start();
  };

  const closeChat = () => {
    Animated.parallel([
      Animated.timing(slideAnim, { toValue: 300, duration: 240, useNativeDriver: true }),
      Animated.timing(fadeAnim, { toValue: 0, duration: 200, useNativeDriver: true }),
    ]).start(() => setOpen(false));
  };

  const pressBubble = () => {
    Animated.sequence([
      Animated.timing(scaleAnim, { toValue: 0.88, duration: 90, useNativeDriver: true }),
      Animated.spring(scaleAnim, { toValue: 1, useNativeDriver: true }),
    ]).start();
    openChat();
  };

  // Gửi tin nhắn lên server để admin đọc và trả lời
  const sendToServer = useCallback(async (msg: string) => {
    try {
      await fetch(`${API_URL}/api/support/message`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: msg, sender: 'user', timestamp: new Date().toISOString() }),
      });
    } catch {
      // Không alert lỗi — tin nhắn vẫn hiển thị local
    }
  }, []);

  const sendMessage = () => {
    const trimmed = text.trim();
    if (!trimmed) return;

    const userMsg: Message = {
      id: Date.now().toString(),
      text: trimmed,
      sender: 'user',
      time: getNow(),
    };
    setMessages((prev) => [...prev, userMsg]);
    setText('');

    // Gửi tin nhắn lên server
    sendToServer(trimmed);

    setTimeout(() => flatRef.current?.scrollToEnd({ animated: true }), 100);

    // Chỉ auto-reply 1 lần duy nhất khi user nhắn lần đầu
    if (!hasAutoReplied) {
      setTyping(true);
      setTimeout(() => {
        setTyping(false);
        const reply: Message = {
          id: (Date.now() + 1).toString(),
          text: AUTO_REPLY_TEXT,
          sender: 'support',
          time: getNow(),
        };
        setMessages((prev) => [...prev, reply]);
        setHasAutoReplied(true);
        setTimeout(() => flatRef.current?.scrollToEnd({ animated: true }), 100);
      }, 1200);
    }
  };

  const renderMsg = ({ item }: { item: Message }) => {
    const isUser = item.sender === 'user';
    return (
      <View style={[styles.msgRow, isUser ? styles.msgRowUser : styles.msgRowSupport]}>
        {!isUser && (
          <View style={styles.supportAvatar}>
            <Text style={{ fontSize: 14 }}>👩‍💼</Text>
          </View>
        )}
        <View style={[styles.bubble, isUser ? styles.bubbleUser : styles.bubbleSupport]}>
          <Text style={[styles.bubbleText, isUser && styles.bubbleTextUser]}>{item.text}</Text>
          <Text style={[styles.bubbleTime, isUser && styles.bubbleTimeUser]}>{item.time}</Text>
        </View>
      </View>
    );
  };

  return (
    <>
      {/* ── Floating Bubble ── */}
      {!open && (
        <Animated.View style={[styles.bubbleWrap, { transform: [{ scale: scaleAnim }] }]}>
          {/* Pulse ring */}
          <Animated.View style={[styles.pulseRing, { transform: [{ scale: pulseAnim }] }]} />

          <TouchableOpacity style={styles.fab} onPress={pressBubble} activeOpacity={0.85}>
            <Ionicons name="chatbubble-ellipses" size={26} color="#FFF" />
          </TouchableOpacity>

          {/* Unread badge */}
          {unread > 0 && (
            <View style={styles.unreadBadge}>
              <Text style={styles.unreadText}>{unread}</Text>
            </View>
          )}
        </Animated.View>
      )}

      {/* ── Chat Box ── */}
      {open && (
        <Animated.View
          style={[
            styles.chatBox,
            { opacity: fadeAnim, transform: [{ translateY: slideAnim }] },
          ]}
        >
          {/* Header */}
          <View style={styles.chatHeader}>
            <View style={styles.supportAvatarLg}>
              <Text style={{ fontSize: 22 }}>👩‍💼</Text>
            </View>
            <View style={{ flex: 1, justifyContent: 'center' }}>
              <View style={{ flexDirection: 'row', alignItems: 'baseline', marginBottom: 2 }}>
                <Text style={styles.chatHeaderName}>Hỗ trợ </Text>
                <Text style={[styles.chatHeaderName, { color: ORANGE, fontStyle: 'italic', fontSize: 15, letterSpacing: -0.5 }]}>FoodApp</Text>
              </View>
              <View style={styles.onlineRow}>
                <View style={styles.onlineDot} />
                <Text style={styles.onlineText}>Đang hoạt động</Text>
              </View>
            </View>
            <TouchableOpacity style={styles.closeBtn} onPress={closeChat}>
              <Ionicons name="chevron-down" size={20} color="#616161" />
            </TouchableOpacity>
          </View>

          {/* Messages */}
          <KeyboardAvoidingView
            behavior={Platform.OS === 'ios' ? 'padding' : undefined}
            style={{ flex: 1 }}
            keyboardVerticalOffset={10}
          >
            <FlatList
              ref={flatRef}
              data={messages}
              keyExtractor={(item) => item.id}
              renderItem={renderMsg}
              contentContainerStyle={styles.msgList}
              showsVerticalScrollIndicator={false}
              onLayout={() => flatRef.current?.scrollToEnd({ animated: false })}
            />

            {/* Typing indicator */}
            {typing && (
              <View style={[styles.msgRow, styles.msgRowSupport, { paddingHorizontal: 12, paddingBottom: 4 }]}>
                <View style={styles.supportAvatar}>
                  <Text style={{ fontSize: 14 }}>👩‍💼</Text>
                </View>
                <View style={styles.typingBubble}>
                  <TypingDots />
                </View>
              </View>
            )}

            {/* Input */}
            <View style={styles.inputBar}>
              <TextInput
                style={styles.chatInput}
                placeholder="Nhập tin nhắn..."
                placeholderTextColor="#BDBDBD"
                value={text}
                onChangeText={setText}
                onSubmitEditing={sendMessage}
                returnKeyType="send"
                multiline
                maxLength={300}
              />
              <TouchableOpacity
                style={[styles.sendBtn, !text.trim() && styles.sendBtnDisabled]}
                onPress={sendMessage}
                disabled={!text.trim()}
              >
                <Ionicons name="send" size={16} color="#FFF" />
              </TouchableOpacity>
            </View>
          </KeyboardAvoidingView>
        </Animated.View>
      )}

      {/* Dimmed overlay when chat open */}
      {open && (
        <TouchableOpacity style={styles.dimOverlay} activeOpacity={1} onPress={closeChat} />
      )}
    </>
  );
}

// â”€â”€ Typing dots animation â”€â”€
function TypingDots() {
  const d1 = useRef(new Animated.Value(0)).current;
  const d2 = useRef(new Animated.Value(0)).current;
  const d3 = useRef(new Animated.Value(0)).current;

  React.useEffect(() => {
    const dot = (anim: Animated.Value, delay: number) =>
      Animated.loop(
        Animated.sequence([
          Animated.delay(delay),
          Animated.timing(anim, { toValue: -5, duration: 300, useNativeDriver: true }),
          Animated.timing(anim, { toValue: 0, duration: 300, useNativeDriver: true }),
          Animated.delay(600),
        ])
      );
    dot(d1, 0).start();
    dot(d2, 200).start();
    dot(d3, 400).start();
  }, []);

  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 4, paddingVertical: 2 }}>
      {[d1, d2, d3].map((d, i) => (
        <Animated.View
          key={i}
          style={{
            width: 7, height: 7, borderRadius: 3.5,
            backgroundColor: '#9E9E9E',
            transform: [{ translateY: d }],
          }}
        />
      ))}
    </View>
  );
}

const BOX_H = Math.min(SCREEN_H * 0.55, 480);

const styles = StyleSheet.create({
  // â”€â”€ Floating Bubble â”€â”€
  bubbleWrap: {
    position: 'absolute',
    bottom: Platform.OS === 'ios' ? 104 : 80,
    right: 18,
    zIndex: 999,
    alignItems: 'center',
    justifyContent: 'center',
  },
  pulseRing: {
    position: 'absolute',
    width: 62, height: 62, borderRadius: 31,
    backgroundColor: ORANGE + '28',
  },
  fab: {
    width: 54, height: 54, borderRadius: 27,
    backgroundColor: ORANGE,
    alignItems: 'center', justifyContent: 'center',
    shadowColor: ORANGE,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.45,
    shadowRadius: 10,
    elevation: 10,
  },
  unreadBadge: {
    position: 'absolute', top: -2, right: -2,
    width: 20, height: 20, borderRadius: 10,
    backgroundColor: '#E53935',
    alignItems: 'center', justifyContent: 'center',
    borderWidth: 1.5, borderColor: '#FFF',
  },
  unreadText: { color: '#FFF', fontSize: 10, fontWeight: '800' },

  // â”€â”€ Chat Box â”€â”€
  dimOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.25)',
    zIndex: 997,
  },
  chatBox: {
    position: 'absolute',
    bottom: Platform.OS === 'ios' ? 104 : 78,
    right: 14,
    width: Math.min(SCREEN_W - 28, 360),
    height: BOX_H,
    backgroundColor: '#FFF',
    borderRadius: 20,
    overflow: 'hidden',
    zIndex: 998,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.18,
    shadowRadius: 20,
    elevation: 20,
  },
  chatHeader: {
    flexDirection: 'row', alignItems: 'center',
    paddingHorizontal: 14, paddingVertical: 12,
    backgroundColor: '#F9F9F9',
    borderBottomWidth: 1, borderBottomColor: '#F0F0F0',
    gap: 10,
  },
  supportAvatarLg: {
    width: 40, height: 40, borderRadius: 20,
    backgroundColor: '#F0FDF4',
    alignItems: 'center', justifyContent: 'center',
  },
  chatHeaderName: { fontSize: 14, fontWeight: '800', color: '#212121' },
  onlineRow: { flexDirection: 'row', alignItems: 'center', gap: 5 },
  onlineDot: { width: 7, height: 7, borderRadius: 3.5, backgroundColor: ORANGE },
  onlineText: { fontSize: 11, color: ORANGE, fontWeight: '600' },
  closeBtn: {
    width: 32, height: 32, borderRadius: 16,
    backgroundColor: '#F0F0F0', alignItems: 'center', justifyContent: 'center',
  },

  msgList: { padding: 12, gap: 8, paddingBottom: 4 },
  msgRow: { flexDirection: 'row', alignItems: 'flex-end', gap: 6, marginBottom: 6 },
  msgRowUser: { justifyContent: 'flex-end' },
  msgRowSupport: { justifyContent: 'flex-start' },

  supportAvatar: {
    width: 28, height: 28, borderRadius: 14,
    backgroundColor: '#F0FDF4',
    alignItems: 'center', justifyContent: 'center',
    flexShrink: 0,
  },

  bubble: {
    maxWidth: '78%',
    borderRadius: 16,
    paddingHorizontal: 12, paddingVertical: 8,
  },
  bubbleUser: {
    backgroundColor: ORANGE,
    borderBottomRightRadius: 4,
  },
  bubbleSupport: {
    backgroundColor: '#F3F3F3',
    borderBottomLeftRadius: 4,
  },
  bubbleText: { fontSize: 13.5, color: '#212121', lineHeight: 19 },
  bubbleTextUser: { color: '#FFF' },
  bubbleTime: { fontSize: 10, color: '#9E9E9E', marginTop: 3, textAlign: 'right' },
  bubbleTimeUser: { color: 'rgba(255,255,255,0.7)' },

  typingBubble: {
    backgroundColor: '#F3F3F3', borderRadius: 16, borderBottomLeftRadius: 4,
    paddingHorizontal: 12, paddingVertical: 10,
  },

  inputBar: {
    flexDirection: 'row', alignItems: 'flex-end',
    paddingHorizontal: 10, paddingVertical: 8,
    borderTopWidth: 1, borderTopColor: '#F0F0F0',
    gap: 8, backgroundColor: '#FFF',
  },
  chatInput: {
    flex: 1,
    backgroundColor: '#F5F5F5',
    borderRadius: 20,
    paddingHorizontal: 14, paddingVertical: 9,
    fontSize: 14, color: '#212121',
    maxHeight: 80,
  },
  sendBtn: {
    width: 36, height: 36, borderRadius: 18,
    backgroundColor: ORANGE,
    alignItems: 'center', justifyContent: 'center',
  },
  sendBtnDisabled: { backgroundColor: '#D0D0D0' },
});

