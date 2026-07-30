"""
前情提示:此视频教程需在正确安装 Python 环境的情况下才能正常进行程序代码;
如果没有安装好 python 解释器和 pycharm 编辑器的同学,可以一键三连后在评论区留言,我会发给大家;
或者也可以直接私信找我领取。
"""
import os
import json
import time
import execjs
import requests
from lxml import etree
from jsonpath import jsonpath


# 定义请求头
headers = {
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/114.0.0.0 Safari/537.36',
    'cookie': '_iuqxldmzr_=32; _ntes_nnid=d00225525571dd1230356a9ee5a40186,1767790014639; _ntes_nuid=d00225525571dd1230356a9ee5a40186; NMTID=00OCVyRMrcXl6b_cksBn9G8YR8paEIAAAGbmH7yOw; WM_TID=o9rX206yM85BUVQQBFLT24eAfv37C%2FxH; WEVNSM=1.0.0; WNMCID=exexzf.1767790016918.01.0; sDeviceId=YD-0eViaSSjbX9FQ1AFRReDnpLBb%2FsVkcPb; ntes_utid=tid._.5WkxZp%252Bi4gdBVkFQEVbHj9fBa%252B4A1NPc._.0; __snaker__id=Mf2HiTCL3xwB18xH; ntes_kaola_ad=1; Hm_lvt_1483fb4774c02a30ffa6f0e2945e9b70=1767790015,1767960468,1768397135,1768454910; __csrf=92adecb6778b9bb2d5fd02f4a1b4ae25; JSESSIONID-WYYY=kbocqOJ6R%5CY0TJdPH4sScXrkvvIwc4FEER97fWaH3rNlXizvUbSJxRHFBuvhtsTYKHq%2F3Ia6%2Buis3Rfvf1XufzpwkCj5ECuCf8mvdNpA%2Bxwe6bCP%5Cb16Jj9j5Ugz7czCk1wBlJ3iFCMMevmJxHH7kT%5CRnl0Fw4TjB%2FdOvASRqFrRjUUl%3A1770106064684; Hm_lvt_d94b7d26fa25db7f6413fb58d7a438c7=1769429449,1769596923,1769601959,1770104265; HMACCOUNT=6ECC404E78826B54; WM_NI=tofT%2BszeyrgOU5qvjj8qAbjS727XAaq%2BNlxZHmMl%2Fp5rI0SDIJSHqIuDb0nFybH3isyhxqMwoRHkegcoRNID8sspsrkuU8A8tzaUSM2XDKTMLD5uCAPj2sFzVKjjKZq%2BTjU%3D; WM_NIKE=9ca17ae2e6ffcda170e2e6eea7cf61ed98a9d0f467898e8fb3d84a869b8fadc78086efadadce7f85f5bdafd42af0fea7c3b92ab8b1aab5aa79babbb793e64597ebbf97e962fcaf8f83e959f5eef9b9c46bb3f5828dfb528cb3838dae7cf7ae87d1d2508b969da9f443b79caed1ed4ebbbe88d4ec79bbb8b892d07dad8e888ce86da1b19eafcc50fcadbd91f27aa9ab9bd9c434b8a6afb6d247f2888cacd747909cfb96c24b94b6fe94c5729695a68bca52b3f59c8bd837e2a3; gdxidpyhxdE=DpNiWltDUEt4%2Bw81plU1rtT3%2FIoRDenwN98k%2BZctjp9SH1oR8eCyxDUIiHWvt1BNafLCIVqEsPxvxBxCGxuEv5ZK6Zusg7ysCfLulImceeXiW26CCRrD%5CyaXlil2gA2qn5TtEd995XEXWdapv0OcqAz1Pw74AVo4Y1W%2FY5PZ%5C%5Cmkjl6c%3A1770105167296; __csrf=c764d4421fa3236e91038dd62200982f; MUSIC_U=0098D21AF3BA78556E1A5DE71266D07FE761341AC9CF38CAE4E13034908E2AEE9218BF22269C0ED7D48F821B588FEF72D0CB50AFEFE874C25B5E24DCA2D361E36ECC775B096CA5CE9A4CB71960A16641FCB2BE4209FDD914272B1FF2EE8DDCF1F2E1448F91DF809F2F978157C7D24B8F730A4DD45A7EBDEFC4E5A728BA91134E0E2E3903B3203F541C8BF06D55B1AB752E339F274EC93583E2D113B8841C07C599E60CC5B519A29260287D6BA22319AB6C7BC80FF75E6D66C00857E5CF06048C394F828D0159C884C6DBA0AD4E97742E0C8DBC086BDAA9A68523EBE9531825DEA2FF5AC3EADDBD82EACB71C05F03FAD73D95E379F287E33BABA3F961E08942593E4FF6609C12C440DEC55F0CFB2899591B83749C86BD5442DAEC33FA2A899AE9EF7EFA7CA981EFDF449D7A2E8B228A7A108570FFBF9FD7D017863B517D7EA60E2E988578965E12E8F7622A172C8C6EDE7A1A300D9DC89435228B8B0138F7FA5BE8A0E9C8C0061C8B38E87336EAED643C5904E7468069E6D0927528DE79A9B35FF925309CB005EFA8741F7FE04284C5ED66; Hm_lpvt_d94b7d26fa25db7f6413fb58d7a438c7=1770104338'
}


def get_music_url(music_id):
    # 定义参数
    args_dict = {
        "ids": f"[{music_id}]",
        "level": "standard",
        "encodeType": "aac",
        "csrf_token": "76ae6d9119bec2746e07ac368e995601"
    }

    # 将字典参数转换成json字符串格式
    args_str = json.dumps(args_dict)

    # 读取js文件
    js_data = open('wangyiyun.js', encoding='utf-8').read()
    # 将js代码转换成js对象
    js_obj = execjs.compile(js_data)
    # 调用js代码中的方法，并传入参数
    form_data = js_obj.call('get_data', args_str)

    # 定义响应音乐数据包的链接
    url = 'https://music.163.com/weapi/song/enhance/player/url/v1?csrf_token=5b9cd3304522afed3370bba2c09e1c01'

    # 发起网络请求
    response = requests.post(url, headers=headers, data=form_data)

    # 筛选数据歌曲下载
    music_url = jsonpath(response.json(), '$..url')[0]

    return music_url


def get_music_content(index_url):
    # 发起网络请求
    response = requests.get(index_url, headers=headers)

    # 将网页的html字符串转换成树形结构
    html = etree.HTML(response.text)

    # 使用xpath表达式来筛选出音乐的ID
    id_info_list = html.xpath('//ul[@class="f-hide"]/li/a/@href')
    # print(id_info_list)

    # 使用xpath表达式来筛选出音乐的名称
    name_list = html.xpath('//ul[@class="f-hide"]/li/a/text()')
    # print(name_list)

    # 判断路径中是否有对应的文件夹, 如果存在则跳过
    if not os.path.exists('网易云音乐'):
        # 如果不存在就创建这个文件夹
        os.mkdir('网易云音乐')

    # 使用列表进行遍历
    for id_info, name in zip(id_info_list, name_list):
        # 对ID信息使用=进行切割，获取右边的ID数字
        music_id = id_info.split('=')[1]

        # 调用get_music_url函数获取音乐下载链接
        music_url = get_music_url(music_id)

        # 发起网络请求，获取音乐数据
        response = requests.get(music_url, headers=headers)
        name = name.replace('/', '-').replace('?', '？').replace('"', '“')
        # 将获取的音乐数据保存到音乐文件中
        with open(f'./网易云音乐/{name}.mp3', 'wb') as file:
            file.write(response.content)

        print(f'音乐名称：{name} 下载完毕')

        time.sleep(1)


if __name__ == '__main__':
    # 定义歌单的请求链接
    index_url = f'https://music.163.com/playlist?id={input("请输入歌单id:")}'

    # 调用get_music_content下载歌曲
    get_music_content(index_url)
