import React, { memo, Props, useMemo } from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  SafeAreaView,
  ScrollView,
  StyleProp,
  StyleSheet,
  View,
  ViewStyle
} from 'react-native';

interface IProps extends Props<{}> {
  backgroundColor?: string;
  withSafeArea?: boolean;
  disableScroolView?: boolean;
  style?: StyleProp<ViewStyle>;
}

const KeyboardScrollContainer = memo(
  ({ children, backgroundColor, withSafeArea, disableScroolView, style }: IProps) => {
    const containerStyle = useMemo(
      () => ({
        ...styles.container,
        backgroundColor
      }),
      [backgroundColor]
    );

    const contentStyle = useMemo(() => [styles.content, style], [style]);

    let ResultView = <View style={contentStyle}>{children}</View>;

    ResultView = !disableScroolView ? (
      <ScrollView
        style={containerStyle}
        contentContainerStyle={styles.scrollContainer}
        bounces={false}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps='handled'
        contentInsetAdjustmentBehavior='automatic'
      >
        {ResultView}
      </ScrollView>
    ) : (
      <View style={containerStyle}>{ResultView}</View>
    );

    ResultView = (
      <KeyboardAvoidingView style={styles.keyboardView} behavior={Platform.OS === 'ios' ? 'padding' : null}>
        {ResultView}
      </KeyboardAvoidingView>
    );

    if (withSafeArea) {
      ResultView = <SafeAreaView style={containerStyle}>{ResultView}</SafeAreaView>;
    }

    return ResultView;
  }
);

KeyboardScrollContainer.displayName = 'KeyboardScrollContainer';

const styles = StyleSheet.create({
  keyboardView: {
    flex: 1
  },
  container: {
    flex: 1
  },
  scrollContainer: {
    flexGrow: 1
  },
  content: {
    padding: 20,
    flex: 1
  }
});

export default KeyboardScrollContainer;
