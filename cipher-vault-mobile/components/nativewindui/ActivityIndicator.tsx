import { ActivityIndicator as RNActivityIndicator } from 'react-native';

export function ActivityIndicator({ color = '#818cf8', size = 'small', ...props }: React.ComponentProps<typeof RNActivityIndicator>) {
  return (
    <RNActivityIndicator
      color={color}
      size={size}
      {...props}
    />
  );
}
