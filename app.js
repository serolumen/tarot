
'use strict';

let names = ['愚人','魔术师','女祭司','女皇','皇帝','教皇','恋人','战车','力量','隐者','命运之轮','正义','倒吊人','死神','节制','恶魔','高塔','星星','月亮','太阳','审判','世界'];
for (const suit of ['权杖','圣杯','宝剑','星币']) {
    for (const rank of ['首牌','二','三','四','五','六','七','八','九','十','侍从','骑士','王后','国王']) {
        names.push(suit + rank);
    }
}

const positions = {
    '单牌': ['单牌'],
    '无牌阵': ['第一张','第二张','第三张'],
    '时间流': ['过去的状况/形成的原因','现在的状况','未来的发展'],
    '圣三角': ['发展','阻碍','建议'],
    '二选一': ['你的状态','选择1的过程','选择1的结果','选择2的过程','选择2的结果']
};

const $ = id => document.getElementById(id);
let meanings = {};
let imageURL = null;

// ===============================
// 图片配色配置（自行修改颜色）
// ===============================

const COLOR_THEMES = {
    theme2: {
        background: '#171522',   // 整张图片的背景
        title: '#f3dfba',        // 顶部自定义标题
        position: '#f3dfba',     // 塔罗牌图片下方的牌位名称
        heading: '#f3dfba',      // 释义部分的小标题
        meaning: '#e9e6ee'       // 释义正文
    },

    theme1: {
        background: '#FFFFFF',   // 整张图片的背景
        title: '#333333',        // 顶部自定义标题
        position: '#333333',     // 塔罗牌图片下方的牌位名称
        heading: '#333333',      // 释义部分的小标题
        meaning: '#454545'       // 释义正文
    }
};

function imagePath(id, reverse) {
    return `images/${id}${reverse ? '.1' : ''}.png`;
}

function setup() {
    const slots = $('slots');
    slots.innerHTML = '';

    positions[$('spread').value].forEach((position, i) => {
        const section = document.createElement('section');
        section.className = 'slot';

        const h = document.createElement('h3');
        h.textContent = `${i + 1}. ${position}`;

        const label = document.createElement('label');
        label.textContent = '选择塔罗牌';

        const select = document.createElement('select');
        select.className = 'card';

        names.forEach((name, id) => {
            const opt = document.createElement('option');
            opt.value = String(id + 1);
            opt.textContent = name;
            select.append(opt);
        });

        select.value = String((i % 78) + 1);
        label.append(select);

        const revLabel = document.createElement('label');
        revLabel.className = 'reverse';

        const check = document.createElement('input');
        check.type = 'checkbox';
        check.className = 'reversed';
        check.style.width = 'auto';
        check.style.display = 'inline';

        revLabel.append(check, document.createTextNode(' 逆位 '));
        section.append(h, label, revLabel);
        slots.append(section);
    });
}

function getMeaning(name, reverse) {
    const item = meanings[name + '释义'] ?? meanings[name];

    if (typeof item === 'string') return item;

    if (Array.isArray(item)) {
        const value = item[0];
        return typeof value === 'string' ? value : JSON.stringify(value);
    }

    if (item && typeof item === 'object') {
        const value = item[reverse ? '逆位' : '正位']
            ?? item[reverse ? 'reversed' : 'upright']
            ?? item.meaning;
        return typeof value === 'string' ? value : '';
    }

    return '';
}

// 中文排版：禁止行首标点和行尾前置标点
const NO_LINE_START = new Set(
    '，。！？；：、,.!?;:)]}）】》〉」』”’％%…'
);
const NO_LINE_END = new Set(
    '([{（【《〈「『“‘'
);

function wrap(ctx, text, maxWidth) {
    const result = [];

    for (const paragraph of String(text).split(/\r?\n/)) {
        if (!paragraph) {
            result.push('');
            continue;
        }

        const chars = Array.from(paragraph);
        let start = 0;

        while (start < chars.length) {
            let end = start + 1;

            // 先找到当前宽度内能够容纳的最大字符范围
            while (
                end < chars.length &&
                ctx.measureText(chars.slice(start, end + 1).join('')).width <= maxWidth
            ) {
                end++;
            }

            // 还没有到段落结尾时，调整不合适的断行位置
            if (end < chars.length) {
                // 不能让逗号、句号、右括号等出现在下一行开头
                while (end < chars.length && NO_LINE_START.has(chars[end])) {
                    end++;
                }

                // 不能让左括号、左引号等留在上一行结尾
                while (end > start + 1 && NO_LINE_END.has(chars[end - 1])) {
                    end--;
                }
            }

            result.push(chars.slice(start, end).join(''));
            start = end;
        }
    }

    return result.length ? result : [''];
}

function loadImage(src) {
    return new Promise((resolve, reject) => {
        const img = new Image();
        img.onload = () => resolve(img);
        img.onerror = () => reject(new Error('图片加载失败：' + src));
        img.src = src;
    });
}



async function generate() {
    const button = $('generate');
    button.disabled = true;
    $('status').textContent = '正在生成，请稍候……';

    try {
        if (document.fonts) await document.fonts.load('22px Tarot');

        const spread = $('spread').value;
        const theme = COLOR_THEMES[$('colorTheme').value] || COLOR_THEMES.theme1;

        let sections = [...document.querySelectorAll('.slot')].map((el, i) => ({
            id: Number(el.querySelector('.card').value),
            reverse: el.querySelector('.reversed').checked,
            position: positions[spread][i]
        }));

        // 二选一：只调整生成图片的顺序，不改变网页上的选牌顺序
        if (spread === '二选一') {
            sections = [sections[2], sections[1], sections[0], sections[3], sections[4]];
        }

        // 图片下方的牌位标签；单牌和无牌阵不显示
        const positionLabels = {
            '时间流': ['过去', '现在', '未来'],
            '圣三角': ['发展', '阻碍', '建议'],
            '二选一': ['选择1结果', '选择1过程', '你的状态', '选择2过程', '选择2结果']
        };

        const labels = positionLabels[spread] || [];
        const imgs = await Promise.all(
            sections.map(c => loadImage(imagePath(c.id, c.reverse)))
        );

        // 图片布局参数
        const n = sections.length;
        const w = n <= 3 ? 250 : 195;
        const h = n <= 3 ? 385 : 300;
        const margin = 42;
        const gap = 20;
        const width = Math.max(900, margin * 2 + n * w + (n - 1) * gap);
        const title = $('title').value.trim();

        // 计算释义排版
        const measure = document.createElement('canvas').getContext('2d');
        measure.font = '21px Tarot, sans-serif';

        const blocks = sections.map((c, i) => {
            const name = names[c.id - 1];
            let heading;

            if (spread === '单牌' || spread === '无牌阵') {
                heading = `${i + 1}. ${name} · ${c.reverse ? '逆位' : '正位'}`;
            } else {
                heading = `${i + 1}. ${c.position}  |  ${name} · ${c.reverse ? '逆位' : '正位'}`;
            }

            return {
                heading,
                lines: wrap(
                    measure,
                    getMeaning(name, c.reverse),
                    width - margin * 2 - 24
                )
            };
        });

        const lineH = 34;
        const textH = blocks.reduce(
            (sum, b) => sum + 48 + b.lines.length * lineH + 24, 0
        );
        const imgY = title ? 112 : 35;
        const topText = imgY + h + 68;
        const height = topText + textH + margin;

        // 创建画布并绘制背景
        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;

        const ctx = canvas.getContext('2d');
        ctx.fillStyle = theme.background;
        ctx.fillRect(0, 0, width, height);

        // 顶部自定义标题
        if (title) {
            ctx.fillStyle = theme.title;
            ctx.font = 'bold 30px Tarot, sans-serif';
            ctx.textAlign = 'center';
            ctx.fillText("ASK: " + title, width / 2, 65);
            ctx.textAlign = 'left';
        }

        // 绘制塔罗牌图片
        const x0 = (width - (n * w + (n - 1) * gap)) / 2;

        imgs.forEach((img, i) => {
            const ratio = Math.min(w / img.width, h / img.height);
            const dw = img.width * ratio;
            const dh = img.height * ratio;

            ctx.drawImage(
                img,
                x0 + i * (w + gap) + (w - dw) / 2,
                imgY + (h - dh) / 2,
                dw,
                dh
            );

            // 图片下方显示牌位含义，而非塔罗牌名称
            if (labels.length > 0) {
                ctx.font = '21px Tarot, sans-serif';
                ctx.fillStyle = theme.position;
                ctx.textAlign = 'center';
                ctx.fillText(
                    labels[i],
                    x0 + i * (w + gap) + w / 2,
                    imgY + h + 36
                );
                ctx.textAlign = 'left';
            }
        });

        // 绘制释义标题及正文
        let y = topText;

        for (const b of blocks) {
            ctx.fillStyle = theme.heading;
            ctx.font = 'bold 24px Tarot, sans-serif';
            ctx.fillText(b.heading, margin, y + 25);
            y += 48;

            ctx.fillStyle = theme.meaning;
            ctx.font = '21px Tarot, sans-serif';

            for (const line of b.lines) {
                ctx.fillText(line, margin + 12, y + 23);
                y += lineH;
            }

            y += 24;
        }

        // 导出 JPEG
        const blob = await new Promise(resolve =>
            canvas.toBlob(resolve, 'image/jpeg', 0.88)
        );

        if (!blob) throw new Error('无法导出 JPEG');

        if (imageURL) URL.revokeObjectURL(imageURL);
        imageURL = URL.createObjectURL(blob);

        $('preview').src = imageURL;
        $('save').href = imageURL;
        $('result').hidden = false;
        $('status').textContent = '生成成功！可长按图片保存，或点击下方按钮。';
        $('result').scrollIntoView({ behavior: 'smooth' });

    } catch (err) {
        $('status').textContent = '生成失败：' + err.message;
    } finally {
        button.disabled = false;
    }
}



$('spread').addEventListener('change', setup);
$('generate').addEventListener('click', generate);

setup();

fetch('tarot.json')
    .then(r => {
        if (!r.ok) throw Error('HTTP ' + r.status);
        return r.json();
    })
    .then(data => {
        meanings = data;

        const deck = data['_牌库'];
        if (!Array.isArray(deck) || deck.length !== 78) {
            throw Error('_牌库应包含78张牌');
        }

        const parsed = deck.map(x => {
            const m = String(x).match(/^\{_([^}]+)\}/);
            if (!m) throw Error('_牌库格式不正确');
            return m[1];
        });

        names = parsed;
        setup();
        $('status').textContent = '';
    })
    .catch(e => {
        $('status').textContent =
            '牌义数据未加载：' + e.message + '。请确认 tarot.json 已上传。';
    });
