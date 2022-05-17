# font-editor


## 关于内存对齐

`TrueType Font`规范明确规定的内存对齐要求有：

- table需要4字节对齐(long aligned)，使用0进行填充。[1]
- table tag有4个字符组成，不足4个后面补空格



【1】[参考 TrueType Font files: an overview](https://developer.apple.com/fonts/TrueType-Reference-Manual/RM06/Chap6.html)

各个表中的信息是统一的，因为不同的系统和平台会从不同的表中读取相同的信息，所以想要让字体跨平台使用，必须保持这些冗余的信息统一。
