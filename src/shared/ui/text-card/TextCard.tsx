import {TextCardProps} from './types'
import styles from './TextCard.module.css'
function TextCard({header, text, backgroundColor}: TextCardProps){
    return (
        <div className={styles.root} style={{backgroundColor}}>
        <div className={styles.header}>{header}</div>
        <div>{text}</div>
        </div>
    )
}

export default TextCard;