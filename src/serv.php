<?php

$lockfile = "/tmp/php-music-player-db.lock";
$lock = fopen($lockfile, "w+");

function goodbye($msg)
{
    global $lock;
    flock($lock, LOCK_UN);
    fclose($lock);
    die($msg);
}

flock($lock, LOCK_EX);

$MUSIC_DIR = '.';
$DB_FILE = 'db.json';
$EXTS = ['mp3', 'mpeg', 'opus', 'ogg', 'oga', 'wav', 'aac', 'caf', 'm4a', 'mp4', 'weba', 'webm', 'dolby', 'flac'];

function success($content)
{
    $msg = array("ok" => true, "data" => $content);
    goodbye(json_encode($msg));
}

function fail($content)
{
    $msg = array("ok" => false, "data" => $content);
    goodbye(json_encode($msg));
}

function findAudioFiles($dir, $exts)
{
    $audioFiles = [];

    $iterator = new RecursiveIteratorIterator(
        new RecursiveDirectoryIterator(
            $dir,
            RecursiveDirectoryIterator::FOLLOW_SYMLINKS | RecursiveDirectoryIterator::SKIP_DOTS
        ),
        RecursiveIteratorIterator::SELF_FIRST
    );

    foreach ($iterator as $file) {
        // 检查文件是否是 .mp3 或 .flac 文件
        $path = $file->getPathname();
        if (!$file->isFile()) {
            // echo "skip " . $path . "\n";
            continue;
        }
        $ext = strtolower($file->getExtension());
        if (in_array($ext, $exts)) {
            // echo "add music: " . $path . "\n";
            $audioFiles[] = $file->getPathname();
        } else {
            // echo "not music ext: " . $ext . " path: " . $path . "\n";
        }
    }

    return $audioFiles;
}

function get()
{
    global $MUSIC_DIR, $EXTS, $DB_FILE;
    try {
        $audioFiles = findAudioFiles($MUSIC_DIR, $EXTS);
        $s = json_encode($audioFiles);
        success($s);
    } catch (Exception $e) {
        fail($e->getMessage());
    }
}

header('Content-Type: application/json');
try {
    get();
} catch (Exception $e) {
    fail($e->getMessage());
}

fail('bad request');
