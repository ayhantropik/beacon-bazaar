import React from 'react';
import { View, StyleSheet } from 'react-native';
import { Text } from 'react-native-paper';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';

const PRIMARY = '#1a6b52';

interface StepIndicatorProps {
  steps: string[];
  currentStep: number;
}

const StepIndicator: React.FC<StepIndicatorProps> = ({
  steps,
  currentStep,
}) => {
  return (
    <View style={styles.container}>
      <View style={styles.row}>
        {steps.map((step, index) => {
          const isCompleted = index < currentStep;
          const isActive = index === currentStep;
          const isFuture = index > currentStep;

          return (
            <React.Fragment key={index}>
              {index > 0 && (
                <View
                  style={[
                    styles.line,
                    isCompleted || isActive
                      ? styles.lineActive
                      : styles.lineInactive,
                  ]}
                />
              )}
              <View style={styles.stepColumn}>
                <View
                  style={[
                    styles.circle,
                    isCompleted && styles.circleCompleted,
                    isActive && styles.circleActive,
                    isFuture && styles.circleFuture,
                  ]}
                >
                  {isCompleted ? (
                    <Icon name="check" size={16} color="#fff" />
                  ) : (
                    <Text
                      style={[
                        styles.stepNumber,
                        isActive && styles.stepNumberActive,
                        isFuture && styles.stepNumberFuture,
                      ]}
                    >
                      {index + 1}
                    </Text>
                  )}
                </View>
                <Text
                  style={[
                    styles.label,
                    (isCompleted || isActive) && styles.labelActive,
                  ]}
                  numberOfLines={1}
                >
                  {step}
                </Text>
              </View>
            </React.Fragment>
          );
        })}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    paddingVertical: 16,
    paddingHorizontal: 12,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'center',
  },
  stepColumn: {
    alignItems: 'center',
    width: 72,
  },
  circle: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  circleCompleted: {
    backgroundColor: PRIMARY,
  },
  circleActive: {
    backgroundColor: PRIMARY,
  },
  circleFuture: {
    backgroundColor: '#fff',
    borderWidth: 2,
    borderColor: '#ccc',
  },
  stepNumber: {
    fontSize: 14,
    fontWeight: '600',
    color: '#fff',
  },
  stepNumberActive: {
    color: '#fff',
  },
  stepNumberFuture: {
    color: '#999',
  },
  line: {
    height: 2,
    flex: 1,
    alignSelf: 'center',
    marginTop: -8,
    marginHorizontal: -8,
    top: 16,
  },
  lineActive: {
    backgroundColor: PRIMARY,
  },
  lineInactive: {
    backgroundColor: '#ddd',
  },
  label: {
    fontSize: 11,
    color: '#999',
    marginTop: 6,
    textAlign: 'center',
  },
  labelActive: {
    color: PRIMARY,
    fontWeight: '600',
  },
});

export default StepIndicator;
