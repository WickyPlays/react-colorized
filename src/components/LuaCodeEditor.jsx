import React, { useState, useEffect } from 'react';
import Editor from 'react-simple-code-editor';
import { highlight, languages } from 'prismjs/components/prism-core';
import 'prismjs/components/prism-clike';
import 'prismjs/components/prism-lua';
import 'prismjs/themes/prism-dark.css';

const LuaCodeEditor = ({ runCode, clearSleep }) => {
    const [luaCode, setLuaCode] = useState('');

    const saveContent = () => {
        localStorage.setItem("code", luaCode)
    }

    function loadContent() {
        let code = localStorage.getItem("code")
        if (code) {
            setLuaCode(code)
        }
    }

    useEffect(() => {
        loadContent()
    }, [])

    const highlightWithLineNumbers = (code, input, language) =>
        highlight(code, input, language)
            .split("\n")
            .map((line, i) => `<span class='editorLineNumber'>${i + 1}</span>${line}`)
            .join("\n");

    return (
        <div>
            <div style={{
                position: 'relative',
                height: '50vh',
                minHeight: '70vh',
                maxHeight: '70vh',
                overflowY: 'scroll'
            }}>
                <Editor
                    textareaId="codeArea"
                    className="editor"
                    value={luaCode}
                    onValueChange={code => setLuaCode(code)}
                    highlight={code => highlightWithLineNumbers(code, languages.lua, 'lua')}
                    padding={10}
                    style={{
                        fontFamily: '"Fira code", "Fira Mono", monospace',
                        fontSize: 12,
                        backgroundColor: '#353535',
                        color: "#FFFFFF",
                    }}
                />
            </div>
            <button onClick={() => {
                saveContent()
                runCode(luaCode)
            }}>Run code</button>
            <button onClick={() => {
                saveContent()
            }}>Save</button>
            <button onClick={() => {
                clearSleep()
            }}>
                Reset
            </button>
        </div>

    );
};

export default LuaCodeEditor;
