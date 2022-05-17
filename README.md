# font-editor

## 关于这个项目的构想

1. 实现一个字体解析器，包括ttf/otf/woff/woff2等web常见字体格式
2. 实现一个web viewer，可在线查看字体文件中所定义的字符、字型等信息
3. 基于上面的viewer，可在线提取字体文件中的指定字符，达到可随意编辑字体文件的目的（主要是裁剪字体文件，或者将多个字体文件中的字符提取到一个字体文件中）

## 关于内存对齐

`TrueType Font`规范明确规定的内存对齐要求有：

- table需要4字节对齐(long aligned)，使用0进行填充。[1]
- table tag有4个字符组成，不足4个后面补空格



【1】[参考 TrueType Font files: an overview](https://developer.apple.com/fonts/TrueType-Reference-Manual/RM06/Chap6.html)

各个表中的信息是统一的，因为不同的系统和平台会从不同的表中读取相同的信息，所以想要让字体跨平台使用，必须保持这些冗余的信息统一。
