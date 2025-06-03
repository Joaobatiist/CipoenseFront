import { TouchableOpacity, TouchableOpacityProps, Text, View } from "react-native";
import { styles } from "./styles";
import { FontAwesomeIcon } from '@fortawesome/react-native-fontawesome';
import { IconDefinition } from '@fortawesome/free-solid-svg-icons';

type Props = TouchableOpacityProps & {
    title: string;
    icon?: IconDefinition;
    iconColor?: string;
    iconSize?: number;
    textColor?: string;  // Nova propriedade para cor do texto
}

export function Button({ 
    title, 
    icon, 
    iconColor = "#1c348e", 
    iconSize = 16,
    textColor,  // Nova prop (opcional)
    ...rest 
}: Props) {
    return (
        <TouchableOpacity activeOpacity={0.1} style={styles.button} {...rest}>
            <View style={styles.buttonContent}>
                {icon && (
                    <FontAwesomeIcon 
                        icon={icon} 
                        size={iconSize} 
                        color={iconColor} 
                        style={styles.icon} 
                    />
                )}
                <Text style={[styles.title, textColor ? { color: textColor } : {}]}>
                    {title}
                </Text>
            </View>
        </TouchableOpacity>
    );
}