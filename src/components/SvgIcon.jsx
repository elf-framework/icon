function makeElement (node) {
    return createElementJsx(node.tag, node.attributes, node.children.map(makeElement));
}

export function SvgIcon (node, props = {}){

    if (props.width && !props.height) {
        props.height = props.width;
    }

    return <span class={`elf--icon ${node.theme}`} data-name={node.name}>
        <svg 
            {...node.icon.attributes}
            fill="currentColor"
            {...props}
        >
            {node.icon.children.map(makeElement)}
        </svg>

    </span>
}