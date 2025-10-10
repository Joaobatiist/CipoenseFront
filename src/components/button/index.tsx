import { IconDefinition } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-native-fontawesome';
import { Text, TouchableOpacity, TouchableOpacityProps, View } from "react-native";
import { styles } from "./styles";

// type annotations removed for JS compatibility

export function Button({ 
    title, 
    icon, 
    iconColor = "#1c348e", 
    iconSize = 16,
    textColor,  // Nova prop (opcional)
    ...rest 
}) {
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
